import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

data = {
    "branch_name": "fix-food-type-filter-final",
    "commit_message": "fix(frontend): stop resetting filter checkboxes on apply/clear\n\nFixed an issue where the food type filters and delivery time filters were failing to apply because the checkboxes were being forcefully re-rendered (and thus cleared) right before reading their state on the 'btn-apply-filters' click event. Also removed the redundant re-rendering from the 'btn-clear-filters' click event.",
    "title": "Fix broken food type filter in frontend",
    "description": "Fixes a bug where clicking 'Aplicar filtros' failed to filter products because the UI checkboxes were being destroyed and recreated before their checked status could be read."
}
req = urllib.request.Request('http://localhost:11434/api/generate', data=json.dumps(data).encode('utf-8'))
try:
    urllib.request.urlopen(req, context=ctx)
except Exception:
    pass
