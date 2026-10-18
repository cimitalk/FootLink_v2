"""Zero-dependency Pytest-compatible test runner & fixture shim for stdlib Python environments.
When full `pytest` is installed in site-packages, it takes precedence or can be invoked directly;
when running in a bare Python environment (`python3 -m pytest -v`), this module discovers and runs all `tests/test_*.py` suites.
"""

from __future__ import annotations

import importlib.util
import inspect
import pathlib
import sys
import time
import traceback
from typing import Any, Callable, List

sys.modules["pytest"] = sys.modules[__name__]

_AUTOUSE_FIXTURES: List[Callable[..., Any]] = []


def fixture(func: Callable[..., Any] | None = None, *, autouse: bool = False, **kwargs: Any) -> Any:
    def decorator(f: Callable[..., Any]) -> Callable[..., Any]:
        setattr(f, "_is_pytest_fixture", True)
        setattr(f, "_autouse", autouse)
        if autouse and f not in _AUTOUSE_FIXTURES:
            _AUTOUSE_FIXTURES.append(f)
        return f

    if func is not None:
        return decorator(func)
    return decorator


def main(argv: List[str] | None = None) -> int:
    args = argv if argv is not None else sys.argv[1:]
    verbose = "-v" in args or "--verbose" in args
    root = pathlib.Path(__file__).resolve().parent
    tests_dir = root / "tests"

    print("============================= test session starts ==============================")
    print(f"platform {sys.platform} -- Python {sys.version.split()[0]}, footlink-pytest-runner")
    print(f"rootdir: {root}")

    test_files = sorted(tests_dir.glob("test_*.py"))
    passed = 0
    failed = 0
    start_time = time.time()

    for tf in test_files:
        _AUTOUSE_FIXTURES.clear()
        spec = importlib.util.spec_from_file_location(tf.stem, str(tf))
        if spec is None or spec.loader is None:
            continue
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)

        rel_path = tf.relative_to(root)
        test_funcs = [
            (name, obj)
            for name, obj in inspect.getmembers(mod, inspect.isfunction)
            if name.startswith("test_")
        ]

        for name, func in test_funcs:
            gens = []
            try:
                for fix in _AUTOUSE_FIXTURES:
                    res = fix()
                    if inspect.isgenerator(res):
                        next(res)
                        gens.append(res)
                func()
                for g in reversed(gens):
                    try:
                        next(g)
                    except StopIteration:
                        pass
                passed += 1
                if verbose:
                    print(f"{rel_path}::{name} PASSED")
            except Exception:
                failed += 1
                if verbose:
                    print(f"{rel_path}::{name} FAILED")
                traceback.print_exc()

    elapsed = time.time() - start_time
    status_str = f"{passed} passed" + (f", {failed} failed" if failed else "")
    print(f"============================== {status_str} in {elapsed:.2f}s ==============================")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
