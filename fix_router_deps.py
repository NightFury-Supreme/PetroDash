import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace [router] with []
    new_content = re.sub(r'\[\s*router\s*\]', '[]', content)
    # Replace [..., router] with [...]
    new_content = re.sub(r',\s*router\b', '', new_content)
    # Replace [router, ...] with [...]
    new_content = re.sub(r'\[\s*router\s*,', '[', new_content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
