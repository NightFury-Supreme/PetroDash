filepath = 'frontend/src/components/admin/plan/PlanDrawer.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Make the Next Step button disable correctly for the Pricing step as well
content = content.replace(
    "disabled={currentStep === 'basics' && (!formData.name || !formData.category || !formData.description)}",
    "disabled={(currentStep === 'basics' && (!formData.name || !formData.category || !formData.description)) || (currentStep === 'pricing' && (formData.pricePerMonth === '' || formData.pricePerMonth === undefined || formData.pricePerMonth === null))}"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated PlanDrawer Pricing Validation")
