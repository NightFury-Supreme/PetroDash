import re

filepath_drawer = 'frontend/src/components/admin/plan/PlanDrawer.tsx'
filepath_form = 'frontend/src/components/admin/plan/PlanForm.tsx'

# Read files
with open(filepath_drawer, 'r', encoding='utf-8') as f:
    drawer_content = f.read()

with open(filepath_form, 'r', encoding='utf-8') as f:
    form_content = f.read()

# We need to completely replace NewPlanWrapper and EditPlanWrapper in PlanDrawer
# to include stepper logic, and add icons to Drawer.
# Also we need to modify PlanForm to accept currentStep.

