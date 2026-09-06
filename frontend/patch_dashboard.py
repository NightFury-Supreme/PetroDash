import re

with open('src/components/dashboard/DashboardContent.tsx', 'r') as f:
    content = f.read()

# Add DeleteDrawer import
if 'DeleteDrawer' not in content:
    content = content.replace("import { DashboardSkeleton } from '../Skeleton';", "import { DashboardSkeleton } from '../Skeleton';\nimport { DeleteDrawer } from '@/components/ui/DeleteDrawer';")

# Add state
if 'deletingServerId' not in content:
    content = content.replace("const [editServerId, setEditServerId] = useState<string | null>(null);", "const [editServerId, setEditServerId] = useState<string | null>(null);\n  const [deletingServerId, setDeletingServerId] = useState<string | null>(null);")

# Replace handleDelete
new_handle_delete = '''  const handleDelete = useCallback((serverId: string, serverName: string) => {
    setDeletingServerId(serverId);
  }, []);

  const handleExecuteDelete = async (serverId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Authentication required');

    const response = await fetch(${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers/, {
      method: 'DELETE',
      headers: { Authorization: Bearer  }
    });

    if (!response.ok) {
      let errorData: any = {}; try { errorData = await response.json(); } catch {}
      throw new Error(errorData?.error || 'Failed to delete server');
    }

    removeServer(serverId);
    setDeletingServerId(null);
  };'''

content = re.sub(r'const handleDelete = useCallback\(\(serverId: string, serverName: string\) => \{.*?\}\);\n', new_handle_delete + '\n', content, flags=re.DOTALL)

# Add DeleteDrawer to JSX
server_to_delete = '''
      {deletingServerId && (
        <DeleteDrawer
          isOpen={!!deletingServerId}
          onClose={() => setDeletingServerId(null)}
          onConfirm={() => handleExecuteDelete(deletingServerId)}
          entityType="Server"
          entityName={servers.find(s => s._id === deletingServerId)?.name || 'Server'}
          entitySubText={Node:  Egg: }
          icon={<Server size={32} />}
          warningPoints={[
            "Server will be permanently deleted.",
            "All active connections will be terminated.",
            "All associated data will be permanently erased.",
            "This action cannot be undone."
          ]}
        />
      )}'''

if 'deletingServerId && (' not in content:
    content = content.replace("    </div>\n  );\n}", server_to_delete + "\n    </div>\n  );\n}")

with open('src/components/dashboard/DashboardContent.tsx', 'w') as f:
    f.write(content)
