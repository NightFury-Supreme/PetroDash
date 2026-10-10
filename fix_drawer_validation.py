filepath = 'frontend/src/components/admin/plan/PlanDrawer.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Update NewPlanWrapper isInvalid
content = content.replace("const isInvalid = !formData.name || formData.pricePerMonth === '' || formData.pricePerMonth === undefined || formData.pricePerMonth === null;", "const isInvalid = !formData.name || !formData.category || !formData.description || formData.pricePerMonth === '' || formData.pricePerMonth === undefined || formData.pricePerMonth === null;")

# Update disabled logic for Next Step
content = content.replace("disabled={currentStep === 'basics' && !formData.name}", "disabled={currentStep === 'basics' && (!formData.name || !formData.category || !formData.description)}")

# Also update EditPlanWrapper isInvalid
content = content.replace("const isInvalid = !plan.name || plan.pricePerMonth === '' || plan.pricePerMonth === undefined || plan.pricePerMonth === null;", "const isInvalid = !plan.name || !plan.category || !plan.description || plan.pricePerMonth === '' || plan.pricePerMonth === undefined || plan.pricePerMonth === null;")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated PlanDrawer.tsx")
