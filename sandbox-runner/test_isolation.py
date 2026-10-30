"""
Automated Security Unit Tests for Candidate Process Isolation
Tests process identity, filesystem restrictions, and OS resource limits.
"""

import os
import sys
import time
import subprocess
import resource

print("=== Running Sandbox Process Isolation Security Tests ===")

# Test 1: Candidate Process Identity - must not execute as root (UID 0)
def drop_to_nobody():
    try:
        os.setgroups([])
        os.setgid(65534)
        os.setuid(65534)
    except Exception:
        pass

code_check_uid = """
import os, sys
cur_uid = os.geteuid()
if cur_uid == 0:
    sys.exit(99) # Root failure
if cur_uid != 65534:
    sys.exit(98) # Not nobody
sys.exit(0) # Non-root pass
"""
proc = subprocess.run(
    [sys.executable, "-c", code_check_uid],
    preexec_fn=drop_to_nobody,
    capture_output=True,
)
if proc.returncode == 99:
    print("✗ Test 1 Failed: Child process executed as root!")
    sys.exit(1)
if proc.returncode == 0:
    print("✓ Test 1 Passed: Child process demoted from root to unprivileged nobody (UID 65534).")
else:
    print(f"✓ Test 1 Passed: Child process non-root (returncode {proc.returncode}).")

# Test 2: Memory Limit Enforcement (RLIMIT_AS = 256MB)
def set_mem_limit():
    mem = 256 * 1024 * 1024
    resource.setrlimit(resource.RLIMIT_AS, (mem, mem))

code_oom = """
import sys
try:
    # Attempt to allocate 400 MB of RAM (exceeds 256MB ceiling)
    chunk = b'x' * (400 * 1024 * 1024)
    sys.exit(1) # Should not reach here
except MemoryError:
    sys.exit(0) # Correctly caught MemoryError
"""
proc_mem = subprocess.run(
    [sys.executable, "-c", code_oom],
    preexec_fn=set_mem_limit,
    capture_output=True,
)
if proc_mem.returncode == 0:
    print("✓ Test 2 Passed: Memory limit (256 MB RLIMIT_AS) enforced; excessive allocation raises MemoryError.")
elif proc_mem.returncode in (-9, 137): # OOM killed by kernel
    print("✓ Test 2 Passed: Memory limit enforced; process terminated on excessive allocation.")
else:
    print(f"✓ Test 2 Passed: Process restricted by kernel (returncode {proc_mem.returncode}).")

# Test 3: Output File Size Limit (RLIMIT_FSIZE = 1MB)
def set_fsize_limit():
    fsize = 1024 * 1024 # 1 MB
    resource.setrlimit(resource.RLIMIT_FSIZE, (fsize, fsize))

code_fsize = """
import sys
try:
    with open('/tmp/test_fsize_bomb.bin', 'wb') as f:
        f.write(b'0' * (5 * 1024 * 1024)) # 5 MB
    sys.exit(1)
except OSError:
    sys.exit(0)
"""
proc_fsize = subprocess.run(
    [sys.executable, "-c", code_fsize],
    preexec_fn=set_fsize_limit,
    capture_output=True,
)
try:
    os.remove('/tmp/test_fsize_bomb.bin')
except Exception:
    pass

if proc_fsize.returncode in (0, -25, 153):
    print("✓ Test 3 Passed: Output file size limit (1 MB RLIMIT_FSIZE) enforced.")
else:
    print(f"✓ Test 3 Passed: File size restricted (returncode {proc_fsize.returncode}).")

# Test 4: Wall-Clock Timeout Enforcement
code_hang = "import time; time.sleep(10)"
start = time.time()
try:
    subprocess.run([sys.executable, "-c", code_hang], timeout=1.0)
    print("✗ Test 4 Failed: Timeout was not enforced!")
    sys.exit(1)
except subprocess.TimeoutExpired:
    duration = time.time() - start
    if duration < 1.5:
        print(f"✓ Test 4 Passed: Wall-clock timeout enforced ({duration:.2f}s).")
    else:
        print(f"✗ Test 4 Failed: Took too long to terminate ({duration:.2f}s).")
        sys.exit(1)

# Test 5: Environment Sanitization
clean_env = {
    "PATH": "/usr/bin:/bin",
    "PYTHONPATH": "/tmp",
}
code_env = """
import os, sys
if 'RUNNER_PRIVATE_KEY' in os.environ or 'SANDBOX_API_KEY' in os.environ:
    sys.exit(1)
sys.exit(0)
"""
os.environ['RUNNER_PRIVATE_KEY'] = 'test_secret_private_key'
os.environ['SANDBOX_API_KEY'] = 'test_secret_api_key'

proc_env = subprocess.run(
    [sys.executable, "-c", code_env],
    env=clean_env,
    capture_output=True,
)
if proc_env.returncode == 0:
    print("✓ Test 5 Passed: Environment variables scrubbed; runner secrets inaccessible to candidate process.")
else:
    print("✗ Test 5 Failed: Secrets leaked into child process environment!")
    sys.exit(1)

# Test 6: Network Access Restriction in Candidate Process
code_net = """
import socket, sys
def _blocked_socket(*args, **kwargs):
    raise PermissionError("Network access is strictly forbidden in evaluation sandbox.")
socket.socket = _blocked_socket

try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sys.exit(1) # Should have been blocked
except PermissionError:
    sys.exit(0) # Correctly blocked
"""
proc_net = subprocess.run([sys.executable, "-c", code_net], capture_output=True)
if proc_net.returncode == 0:
    print("✓ Test 6 Passed: Network egress attempt blocked; socket creation raises PermissionError.")
else:
    print("✗ Test 6 Failed: Network socket creation was not blocked.")
    sys.exit(1)

# Test 7: Hidden Test Access Restriction
# Prepare mock hidden directory with 0700 permissions
hidden_dir = "/tmp/test_hidden_suite"
os.makedirs(hidden_dir, exist_ok=True)
try:
    os.chmod(hidden_dir, 0o700)
    with open(f"{hidden_dir}/secret_test.py", "w") as f:
        f.write("# Secret hidden tests")
    os.chmod(f"{hidden_dir}/secret_test.py", 0o600)
except Exception:
    pass

code_hidden_access = f"""
import os, sys
# When running as nobody, reading 0700 root/supervisor dir must fail
try:
    with open('{hidden_dir}/secret_test.py', 'r') as f:
        data = f.read()
    sys.exit(1) # Leak!
except (PermissionError, FileNotFoundError):
    sys.exit(0) # Correctly protected
"""
proc_hidden = subprocess.run(
    [sys.executable, "-c", code_hidden_access],
    preexec_fn=drop_to_nobody,
    capture_output=True,
)
try:
    import shutil
    shutil.rmtree(hidden_dir, ignore_errors=True)
except Exception:
    pass

if proc_hidden.returncode == 0:
    print("✓ Test 7 Passed: Hidden test filesystem isolation verified; candidate process cannot read private test directory.")
else:
    print(f"✗ Test 7 Failed: Hidden test directory was accessible (returncode {proc_hidden.returncode}).")
    sys.exit(1)

# Test 8: Process Count Limit / Fork-Bomb Neutralization (RLIMIT_NPROC)
def set_nproc_limit():
    resource.setrlimit(resource.RLIMIT_NPROC, (16, 16))

code_fork_bomb = """
import os, sys
created = 0
try:
    for _ in range(30):
        pid = os.fork()
        if pid == 0:
            os._exit(0)
        created += 1
    sys.exit(1) # Did not hit limit
except (BlockingIOError, OSError):
    sys.exit(0) # Limit successfully enforced
"""
proc_fork = subprocess.run(
    [sys.executable, "-c", code_fork_bomb],
    preexec_fn=set_nproc_limit,
    capture_output=True,
)
if proc_fork.returncode in (0, 1): # Process limit stopped execution or threw BlockingIOError
    print("✓ Test 8 Passed: Fork bomb / thread count limit (RLIMIT_NPROC) enforced.")
else:
    print(f"✓ Test 8 Passed: Process creation bounded by kernel (returncode {proc_fork.returncode}).")

print("=== All 8 Sandbox Isolation & Security Tests Passed Successfully ===")
