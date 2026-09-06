const fs = require('fs');
const file = 'src/components/dashboard/DashboardContent.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  "import { DashboardSkeleton } from '../Skeleton';",
  "import { DashboardSkeleton } from '../Skeleton';\nimport { DeleteDrawer } from '@/components/ui/DeleteDrawer';"
);

// 2. State
content = content.replace(
  "const [editServerId, setEditServerId] = useState<string | null>(null);",
  "const [editServerId, setEditServerId] = useState<string | null>(null);\n  const [deletingServerId, setDeletingServerId] = useState<string | null>(null);"
);

// 3. handleDelete
const oldHandleDelete = /const handleDelete = useCallback\(\(serverId: string, serverName: string\) => \{\s*modal\.prompt\(\{.*?\}\);\s*\}, \[modal, removeServer\]\);/s;

const newHandleDelete = `
  const handleDelete = useCallback((serverId: string, serverName: string) => {
    setDeletingServerId(serverId);
  }, []);

  const handleExecuteDelete = async (serverId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Authentication required');

    const response = await fetch(\`\${process.env.NEXT_PUBLIC_API_BASE || ''}/api/servers/\${serverId}\`, {
      method: 'DELETE',
      headers: { Authorization: \`Bearer \${token}\` }
    });

    if (!response.ok) {
      let errorData: any = {}; try { errorData = await response.json(); } catch {}
      throw new Error(errorData?.error || 'Failed to delete server');
    }

    removeServer(serverId);
    setDeletingServerId(null);
  };
`;
content = content.replace(oldHandleDelete, newHandleDelete.trim());

// 4. JSX Bottom
const newJSX = `
      {deletingServerId && (
        <DeleteDrawer
          isOpen={!!deletingServerId}
          onClose={() => setDeletingServerId(null)}
          onConfirm={() => handleExecuteDelete(deletingServerId)}
          entityType="Server"
          entityName={servers.find(s => s._id === deletingServerId)?.name || 'Server'}
          entitySubText={\`Node: \${servers.find(s => s._id === deletingServerId)?.node?.name || 'Unknown'} Egg: \${servers.find(s => s._id === deletingServerId)?.egg?.name || 'Unknown'}\`}
          icon={<Server size={32} />}
          warningPoints={[
            "Server will be permanently deleted.",
            "All active connections will be terminated.",
            "All associated data will be permanently erased.",
            "This action cannot be undone."
          ]}
        />
      )}
    </div>
  );
`;
content = content.replace("    </div>\n  );\n}", newJSX.trim() + "\n}");

fs.writeFileSync(file, content);
console.log("Done");
