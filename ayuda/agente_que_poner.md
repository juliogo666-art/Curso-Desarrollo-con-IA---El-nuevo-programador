'''

# En Open code 

### Enlace: https://opencode.ai/v2/docs/agents

Crea un archivo Markdown para añadir un agente reutilizable. Este ejemplo añade un revisor de solo lectura que el agente principal puede iniciar para realizar revisiones de código:

'''


---
description: Reviews changes for correctness and regressions
mode: subagent
model: anthropic/claude-sonnet-4-5#high
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
---

Review the current changes. List findings in severity order with file and line references.