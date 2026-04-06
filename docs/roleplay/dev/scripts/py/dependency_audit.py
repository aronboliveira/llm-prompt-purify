"""
[DEV] Dependency Audit — Auditoria de dependências por CVEs

Objetivo: Auditar dependências do frontend (npm) e backend (.NET)
para vulnerabilidades conhecidas.

Alvo: raiz do projeto (busca local)
"""
import json
import os
import subprocess
import sys

PROJECT_ROOT = os.environ.get("PROJECT_ROOT", os.getcwd())


def audit_npm(project_root: str) -> dict:
    """Executa npm audit e retorna vulnerabilidades encontradas."""
    result = {"vulnerabilities": [], "total": 0, "error": None}
    pkg_path = os.path.join(project_root, "package.json")

    if not os.path.isfile(pkg_path):
        result["error"] = "package.json não encontrado"
        return result

    try:
        proc = subprocess.run(
            ["npm", "audit", "--json"],
            cwd=project_root,
            capture_output=True,
            text=True,
            timeout=60,
        )
        data = json.loads(proc.stdout) if proc.stdout else {}
        vulns = data.get("vulnerabilities", {})
        for name, info in vulns.items():
            result["vulnerabilities"].append({
                "package": name,
                "severity": info.get("severity", "unknown"),
                "via": [v if isinstance(v, str) else v.get("title", "?")
                        for v in info.get("via", [])],
            })
        result["total"] = len(result["vulnerabilities"])
    except FileNotFoundError:
        result["error"] = "npm não instalado"
    except subprocess.TimeoutExpired:
        result["error"] = "npm audit timeout"
    except (json.JSONDecodeError, KeyError):
        result["error"] = "Erro ao parsear resultado do npm audit"
    return result


def audit_dotnet(project_root: str) -> dict:
    """Verifica dependências .NET para pacotes vulneráveis."""
    result = {"vulnerabilities": [], "total": 0, "error": None}
    csproj_dir = os.path.join(project_root, "backend", "LLMPromptPurify.Api")

    if not os.path.isdir(csproj_dir):
        result["error"] = "Projeto .NET não encontrado"
        return result

    try:
        proc = subprocess.run(
            ["dotnet", "list", "package", "--vulnerable", "--format", "json"],
            cwd=csproj_dir,
            capture_output=True,
            text=True,
            timeout=60,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            try:
                data = json.loads(proc.stdout)
                for project in data.get("projects", []):
                    for fw in project.get("frameworks", []):
                        for pkg in fw.get("topLevelPackages", []):
                            if pkg.get("vulnerabilities"):
                                result["vulnerabilities"].append({
                                    "package": pkg["id"],
                                    "severity": pkg["vulnerabilities"][0].get(
                                        "severity", "unknown"
                                    ),
                                })
            except json.JSONDecodeError:
                # Fallback: parse text output
                for line in proc.stdout.splitlines():
                    if ">" in line and "vulnerability" in line.lower():
                        result["vulnerabilities"].append({"package": line.strip()})
        result["total"] = len(result["vulnerabilities"])
    except FileNotFoundError:
        result["error"] = "dotnet CLI não instalado"
    except subprocess.TimeoutExpired:
        result["error"] = "dotnet audit timeout"
    return result


def main() -> int:
    print(f"[DEV] Dependency Audit — projeto {PROJECT_ROOT}")
    issues = 0

    print("\n--- npm Audit ---")
    npm = audit_npm(PROJECT_ROOT)
    if npm["error"]:
        print(f"  ⚠ {npm['error']}")
    elif npm["total"] == 0:
        print("  ✓ Nenhuma vulnerabilidade npm encontrada.")
    else:
        issues += npm["total"]
        for v in npm["vulnerabilities"]:
            print(f"  ⚠ [{v['severity'].upper()}] {v['package']}")

    print("\n--- .NET Audit ---")
    dotnet = audit_dotnet(PROJECT_ROOT)
    if dotnet["error"]:
        print(f"  ⚠ {dotnet['error']}")
    elif dotnet["total"] == 0:
        print("  ✓ Nenhuma vulnerabilidade .NET encontrada.")
    else:
        issues += dotnet["total"]
        for v in dotnet["vulnerabilities"]:
            print(f"  ⚠ [{v.get('severity', '?').upper()}] {v['package']}")

    print(f"\n=== Total: {issues} vulnerabilidade(s) ===")
    return 1 if issues > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
