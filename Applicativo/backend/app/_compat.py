"""Compatibility layer ensuring Footlink Backend runs seamlessly both with full FastAPI/Pydantic/SQLAlchemy
packages (in virtualenv/CI/production) and with Python 3 standard library only (in zero-dependency sandbox).
"""

from __future__ import annotations

import inspect
import json
import re
from datetime import datetime
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple, Type, get_type_hints

try:
    from pydantic import BaseModel, Field  # type: ignore

    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False

    class _FieldInfo:
        def __init__(
            self,
            default: Any = ...,
            default_factory: Optional[Callable[[], Any]] = None,
            description: Optional[str] = None,
            min_length: Optional[int] = None,
            max_length: Optional[int] = None,
            pattern: Optional[str] = None,
            ge: Optional[float] = None,
            le: Optional[float] = None,
            gt: Optional[float] = None,
            **kwargs: Any,
        ) -> None:
            self.default = default
            self.default_factory = default_factory
            self.description = description
            self.min_length = min_length
            self.max_length = max_length
            self.pattern = pattern
            self.ge = ge
            self.le = le
            self.gt = gt
            self.extra = kwargs

    def Field(
        default: Any = ...,
        *,
        default_factory: Optional[Callable[[], Any]] = None,
        description: Optional[str] = None,
        min_length: Optional[int] = None,
        max_length: Optional[int] = None,
        pattern: Optional[str] = None,
        ge: Optional[float] = None,
        le: Optional[float] = None,
        gt: Optional[float] = None,
        **kwargs: Any,
    ) -> Any:
        return _FieldInfo(
            default=default,
            default_factory=default_factory,
            description=description,
            min_length=min_length,
            max_length=max_length,
            pattern=pattern,
            ge=ge,
            le=le,
            gt=gt,
            **kwargs,
        )

    class ValidationError(ValueError):
        pass

    class BaseModel:
        """Lightweight Pydantic v2-compatible BaseModel fallback for stdlib-only environments."""

        def __init__(self, **data: Any) -> None:
            cls = self.__class__
            hints = self._collect_annotations()
            defaults = self._collect_defaults()

            for field_name in hints:
                field_info = defaults.get(field_name, ...)
                if field_name in data:
                    val = data[field_name]
                elif isinstance(field_info, _FieldInfo):
                    if field_info.default_factory is not None:
                        val = field_info.default_factory()
                    elif field_info.default is not ...:
                        val = field_info.default
                    else:
                        raise ValidationError(f"Field '{field_name}' is required in {cls.__name__}")
                elif field_info is not ...:
                    val = field_info
                else:
                    # Check if Optional
                    hint_str = str(hints[field_name])
                    if "Optional" in hint_str or "None" in hint_str:
                        val = None
                    else:
                        raise ValidationError(f"Field '{field_name}' is required in {cls.__name__}")

                val = self._coerce_and_validate(field_name, val, hints[field_name], field_info)
                setattr(self, field_name, val)

            # Also set any extra attributes if passed
            for k, v in data.items():
                if k not in hints:
                    setattr(self, k, v)

        @classmethod
        def _collect_annotations(cls) -> Dict[str, Any]:
            merged: Dict[str, Any] = {}
            for base in reversed(cls.__mro__):
                if base is object or base is BaseModel:
                    continue
                ann = getattr(base, "__annotations__", {})
                merged.update(ann)
            return merged

        @classmethod
        def _collect_defaults(cls) -> Dict[str, Any]:
            merged: Dict[str, Any] = {}
            for base in reversed(cls.__mro__):
                if base is object or base is BaseModel:
                    continue
                for k, v in base.__dict__.items():
                    if not k.startswith("_") and not callable(v):
                        merged[k] = v
            return merged

        def _coerce_and_validate(self, name: str, val: Any, hint: Any, field_info: Any) -> Any:
            if val is None:
                hint_str = str(hint)
                if "Optional" in hint_str or "None" in hint_str:
                    return None
                raise ValidationError(f"Field '{name}' cannot be None")

            # Resolve nested BaseModel or List[BaseModel] or Enum
            hint_str = str(hint)
            if isinstance(val, list):
                # Check if list of models
                item_cls = self._extract_list_item_model(hint_str)
                if item_cls is not None:
                    coerced_list = []
                    for item in val:
                        if isinstance(item, dict):
                            coerced_list.append(item_cls(**item))
                        else:
                            coerced_list.append(item)
                    val = coerced_list

            enum_cls = self._extract_enum_cls(hint_str)
            if enum_cls is not None and not isinstance(val, enum_cls):
                try:
                    val = enum_cls(val)
                except Exception as exc:
                    raise ValidationError(f"Invalid enum value '{val}' for '{name}'") from exc

            if isinstance(field_info, _FieldInfo):
                if isinstance(val, str):
                    if field_info.min_length is not None and len(val) < field_info.min_length:
                        raise ValidationError(f"Field '{name}' shorter than {field_info.min_length}")
                    if field_info.max_length is not None and len(val) > field_info.max_length:
                        raise ValidationError(f"Field '{name}' longer than {field_info.max_length}")
                    if field_info.pattern is not None and not re.match(field_info.pattern, val):
                        raise ValidationError(f"Field '{name}' does not match pattern {field_info.pattern}")
                if isinstance(val, (int, float)) and not isinstance(val, bool):
                    if field_info.gt is not None and not (val > field_info.gt):
                        raise ValidationError(f"Field '{name}' must be > {field_info.gt}")
                    if field_info.ge is not None and not (val >= field_info.ge):
                        raise ValidationError(f"Field '{name}' must be >= {field_info.ge}")
                    if field_info.le is not None and not (val <= field_info.le):
                        raise ValidationError(f"Field '{name}' must be <= {field_info.le}")
            return val

        def _extract_list_item_model(self, hint_str: str) -> Optional[Type[Any]]:
            import sys

            models_mod = sys.modules.get("app.models")
            if not models_mod:
                return None
            for attr_name in dir(models_mod):
                attr = getattr(models_mod, attr_name)
                if isinstance(attr, type) and issubclass(attr, BaseModel) and attr is not BaseModel:
                    if f"[{attr_name}]" in hint_str or f"[{attr.__module__}.{attr_name}]" in hint_str:
                        return attr
            return None

        def _extract_enum_cls(self, hint_str: str) -> Optional[Type[Enum]]:
            import sys

            models_mod = sys.modules.get("app.models")
            if not models_mod:
                return None
            for attr_name in dir(models_mod):
                attr = getattr(models_mod, attr_name)
                if isinstance(attr, type) and issubclass(attr, Enum) and attr is not Enum:
                    if attr_name in hint_str:
                        return attr
            return None

        def model_dump(self, mode: str = "python") -> Dict[str, Any]:
            result: Dict[str, Any] = {}
            for k in self._collect_annotations():
                v = getattr(self, k, None)
                result[k] = self._serialize_val(v, mode=mode)
            return result

        def _serialize_val(self, v: Any, mode: str = "python") -> Any:
            if isinstance(v, BaseModel):
                return v.model_dump(mode=mode)
            if isinstance(v, list):
                return [self._serialize_val(i, mode=mode) for i in v]
            if isinstance(v, dict):
                return {dk: self._serialize_val(dv, mode=mode) for dk, dv in v.items()}
            if isinstance(v, Enum):
                return v.value if mode == "json" else v
            if isinstance(v, datetime):
                return v.isoformat() if mode == "json" else v
            return v


try:
    from fastapi import FastAPI, HTTPException, Request, status  # type: ignore
    from fastapi.middleware.cors import CORSMiddleware  # type: ignore
    from fastapi.responses import HTMLResponse, Response  # type: ignore

    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False

    class status:
        HTTP_200_OK = 200
        HTTP_201_CREATED = 201
        HTTP_400_BAD_REQUEST = 400
        HTTP_401_UNAUTHORIZED = 401
        HTTP_403_FORBIDDEN = 403
        HTTP_404_NOT_FOUND = 404
        HTTP_409_CONFLICT = 409
        HTTP_422_UNPROCESSABLE_ENTITY = 422

    class HTTPException(Exception):
        def __init__(self, status_code: int, detail: str) -> None:
            super().__init__(detail)
            self.status_code = status_code
            self.detail = detail

    class Response:
        def __init__(
            self,
            content: Any = "",
            status_code: int = 200,
            media_type: str = "text/plain",
            headers: Optional[Dict[str, str]] = None,
        ) -> None:
            self.content = content
            self.status_code = status_code
            self.media_type = media_type
            self.headers = headers or {}

    class HTMLResponse(Response):
        def __init__(self, content: Any = "", status_code: int = 200) -> None:
            super().__init__(content=content, status_code=status_code, media_type="text/html; charset=utf-8")

    class CORSMiddleware:
        pass

    class Request:
        pass

    class _Route:
        def __init__(
            self,
            method: str,
            path: str,
            func: Callable[..., Any],
            status_code: int = 200,
            response_model: Any = None,
            response_class: Any = None,
        ) -> None:
            self.method = method.upper()
            self.path = path
            self.func = func
            self.status_code = status_code
            self.response_model = response_model
            self.response_class = response_class
            param_names = re.findall(r"\{([a-zA-Z0-9_]+)\}", path)
            self.param_names = param_names
            pattern = re.sub(r"\{[a-zA-Z0-9_]+\}", r"([^/]+)", path)
            self.regex = re.compile(f"^{pattern}$")

    class FastAPI:
        """Lightweight FastAPI router & ASGI-compatible dispatcher for stdlib-only environments."""

        def __init__(self, title: str = "", description: str = "", version: str = "0.1.0", **kwargs: Any) -> None:
            self.title = title
            self.description = description
            self.version = version
            self.routes: List[_Route] = []
            self.middlewares: List[Tuple[Any, Dict[str, Any]]] = []

        def add_middleware(self, middleware_cls: Any, **options: Any) -> None:
            self.middlewares.append((middleware_cls, options))

        def get(self, path: str, status_code: int = 200, response_model: Any = None, response_class: Any = None, **kwargs: Any) -> Callable[..., Any]:
            def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
                self.routes.append(_Route("GET", path, func, status_code, response_model, response_class))
                return func

            return decorator

        def post(self, path: str, status_code: int = 200, response_model: Any = None, response_class: Any = None, **kwargs: Any) -> Callable[..., Any]:
            def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
                self.routes.append(_Route("POST", path, func, status_code, response_model, response_class))
                return func

            return decorator

        def patch(self, path: str, status_code: int = 200, response_model: Any = None, response_class: Any = None, **kwargs: Any) -> Callable[..., Any]:
            def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
                self.routes.append(_Route("PATCH", path, func, status_code, response_model, response_class))
                return func

            return decorator

        def put(self, path: str, status_code: int = 200, response_model: Any = None, response_class: Any = None, **kwargs: Any) -> Callable[..., Any]:
            def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
                self.routes.append(_Route("PUT", path, func, status_code, response_model, response_class))
                return func

            return decorator

        def delete(self, path: str, status_code: int = 200, response_model: Any = None, response_class: Any = None, **kwargs: Any) -> Callable[..., Any]:
            def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
                self.routes.append(_Route("DELETE", path, func, status_code, response_model, response_class))
                return func

            return decorator


class StdlibTestResponse:
    """HTTP response object compatible with FastAPI/Starlette TestClient."""

    def __init__(self, status_code: int, body: Any, headers: Optional[Dict[str, str]] = None) -> None:
        self.status_code = status_code
        self._body = body
        self.headers = headers or {"content-type": "application/json"}
        if isinstance(body, str):
            self.text = body
        else:
            self.text = json.dumps(body, default=str)

    def json(self) -> Any:
        if isinstance(self._body, str):
            return json.loads(self._body)
        return json.loads(json.dumps(self._body, default=str))


class StdlibTestClient:
    """In-process TestClient for FastAPI when httpx/starlette are not installed."""

    def __init__(self, app_instance: Any) -> None:
        self.app = app_instance

    def get(self, path: str, **kwargs: Any) -> StdlibTestResponse:
        return self._request("GET", path, **kwargs)

    def post(self, path: str, json: Any = None, **kwargs: Any) -> StdlibTestResponse:
        return self._request("POST", path, json_body=json, **kwargs)

    def patch(self, path: str, json: Any = None, **kwargs: Any) -> StdlibTestResponse:
        return self._request("PATCH", path, json_body=json, **kwargs)

    def put(self, path: str, json: Any = None, **kwargs: Any) -> StdlibTestResponse:
        return self._request("PUT", path, json_body=json, **kwargs)

    def delete(self, path: str, **kwargs: Any) -> StdlibTestResponse:
        return self._request("DELETE", path, **kwargs)

    def _request(self, method: str, path: str, json_body: Any = None, **kwargs: Any) -> StdlibTestResponse:
        import urllib.parse

        parts = path.split("?", 1)
        clean_path = parts[0]
        query_params = dict(urllib.parse.parse_qsl(parts[1])) if len(parts) > 1 else {}
        for route in getattr(self.app, "routes", []):
            if route.method != method.upper():
                continue
            match = route.regex.match(clean_path)
            if not match:
                continue

            path_params = dict(zip(route.param_names, match.groups()))
            sig = inspect.signature(route.func)
            import sys

            func_mod = sys.modules.get(route.func.__module__)
            globalns = vars(func_mod) if func_mod else {}
            try:
                type_hints = get_type_hints(route.func, globalns=globalns)
            except Exception:
                type_hints = {}

            call_kwargs: Dict[str, Any] = {}
            try:
                for param_name, param in sig.parameters.items():
                    if param_name in path_params:
                        call_kwargs[param_name] = path_params[param_name]
                    elif param_name in query_params:
                        call_kwargs[param_name] = query_params[param_name]
                    elif json_body is not None:
                        ann = type_hints.get(param_name, param.annotation)
                        if isinstance(ann, type) and issubclass(ann, BaseModel):
                            call_kwargs[param_name] = ann(**json_body)
                        else:
                            call_kwargs[param_name] = json_body
                result = route.func(**call_kwargs)
                if isinstance(result, Response):
                    return StdlibTestResponse(
                        status_code=result.status_code,
                        body=result.content,
                        headers={"content-type": result.media_type, **result.headers},
                    )
                if isinstance(result, BaseModel):
                    payload = result.model_dump(mode="json")
                elif isinstance(result, list):
                    payload = [item.model_dump(mode="json") if isinstance(item, BaseModel) else item for item in result]
                else:
                    payload = result
                return StdlibTestResponse(status_code=route.status_code, body=payload)
            except HTTPException as exc:
                return StdlibTestResponse(status_code=exc.status_code, body={"detail": exc.detail})
            except Exception as exc:
                if exc.__class__.__name__ == "ValidationError":
                    return StdlibTestResponse(status_code=422, body={"detail": str(exc)})
                raise

        return StdlibTestResponse(status_code=404, body={"detail": "Not Found"})


def get_test_client(app_instance: Any) -> Any:
    if HAS_FASTAPI:
        try:
            from fastapi.testclient import TestClient  # type: ignore

            return TestClient(app_instance)
        except ImportError:
            pass
    return StdlibTestClient(app_instance)
