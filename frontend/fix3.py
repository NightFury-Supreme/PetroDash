import re

with open('src/components/admin/locations/EditLocationDrawer.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

old = """        </div>
    </Drawer>
  );
}"""

new = """        </div>
    </Drawer>

    <DeleteDrawer
      isOpen={isDeleteDrawerOpen}
      onClose={() => setIsDeleteDrawerOpen(false)}
      onConfirm={remove}
      entityType="Location"
      entityName={form?.name || ''}
      entitySubText={form ? `Platform ID: ${form.platformLocationId || 'Not set'}` : ''}
      icon={
        (flagPreview || (form && form.flag && form.flag !== 'pending')) ? (
          <img src={flagPreview || `${process.env.NEXT_PUBLIC_API_BASE || ''}${form?.flag}`} alt="" className="w-6 h-6 object-contain rounded" />
        ) : <Globe size={24} />
      }
      warningPoints={[
        "Location configuration will be permanently deleted.",
        "This action cannot be undone."
      ]}
    />
    </>
  );
}"""

if old.strip() in c:
    c = c.replace(old.strip(), new.strip())
    with open('src/components/admin/locations/EditLocationDrawer.tsx', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Replaced successfully")
else:
    print("Could not find old text")
