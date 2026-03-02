import { useState, useEffect } from 'react';
import { Icons } from './ui/Icons';
import AddUserModal from './modals/AddUserModal';
import s from './UserManagement.module.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_URL;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}api/users/getAll.php`);
      const result = await response.json();
      if (result.success) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (userData) => {
    try {
      const response = await fetch(`${API_BASE}api/users/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const result = await response.json();
      
      if (result.success) {
        await fetchUsers();
        setShowAddModal(false);
        return { success: true, emailSent: result.data?.emailSent };
      } else {
        return { success: false, message: result.message };
      }
    } catch (error) {
      return { success: false, message: 'Error creating user' };
    }
  };

  const getRoleBadgeColor = (roleId) => {
    switch (roleId) {
      case 1: return '#f59e0b';
      case 2: return '#3b82f6';
      case 4: return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>User Management</h1>
          <p className={s.subtitle}>Manage system users and their roles</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className={s.addBtn}>
          <Icons.Plus /> Add User
        </button>
      </div>

      {loading ? (
        <div className={s.loading}>Loading users...</div>
      ) : (
        <div className={s.tableWrapper}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.User_id}>
                  <td>{user.User_id}</td>
                  <td>{user.User_name}</td>
                  <td>{user.User_email}</td>
                  <td>
                    <span 
                      className={s.roleBadge} 
                      style={{ backgroundColor: getRoleBadgeColor(user.Role_id) }}
                    >
                      {user.Role_description}
                    </span>
                  </td>
                  <td>
                    <span className={user.Isactive ? s.statusActive : s.statusInactive}>
                      {user.Isactive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddUser}
        />
      )}
    </div>
  );
}
