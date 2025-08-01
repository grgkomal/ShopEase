// src/screens/adminEmployeeScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import {
  Text,
  Button,
  Card,
  Snackbar,
  Dialog,
  Portal,
  ActivityIndicator,
  FAB,
  Chip,
  IconButton,
  Searchbar,
  Divider,
  List,
  Badge,
  Menu,
  ToggleButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  getAllEmployees, 
  getInactiveEmployees, 
  getAllCustomers, 
  toggleEmployeeStatus,
  updateUserRole 
} from '../services/adminEmployeeCustomerDetails';
import { getCache } from '../utils/auth';
import { styles } from '../theme/styles';
import { theme } from '../theme/theme';
import BottomNavigation from '../navigation/BottomNavigation';

const AdminEmployeeScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [detailsDialogVisible, setDetailsDialogVisible] = useState(false);
  const [roleDialogVisible, setRoleDialogVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('employees'); // 'employees', 'inactive', 'customers'
  const [menuVisible, setMenuVisible] = useState({});
  const [newRole, setNewRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAllEmployees = async () => {
    try {
      setLoading(true);
      console.log('Fetching all active employees...');
      const cachedData = await getCache();
      if (!cachedData || !cachedData.token) {
        console.log('No cached token found, redirecting to login');
        navigation.replace('Login');
        return;
      }

      const result = await getAllEmployees();
      console.log('Active employees fetch result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('Active employees fetched successfully:', result.data);
        setUsers(Array.isArray(result.data) ? result.data : []);
        setFilteredUsers(Array.isArray(result.data) ? result.data : []);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch active employees';
        console.error('Fetch active employees failed:', errorMessage);
        showSnackbar(errorMessage);
        setUsers([]);
        setFilteredUsers([]);
      }
      
    } catch (error) {
      console.error('Error fetching active employees:', error);
      showSnackbar('Failed to load active employees. Please try again.');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchInactiveEmployees = async () => {
    try {
      setLoading(true);
      console.log('Fetching inactive employees...');
      
      const result = await getInactiveEmployees();
      console.log('Inactive employees fetch result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('Inactive employees fetched successfully:', result.data);
        setUsers(Array.isArray(result.data) ? result.data : []);
        setFilteredUsers(Array.isArray(result.data) ? result.data : []);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch inactive employees';
        console.error('Fetch inactive employees failed:', errorMessage);
        showSnackbar(errorMessage);
        setUsers([]);
        setFilteredUsers([]);
      }
      
    } catch (error) {
      console.error('Error fetching inactive employees:', error);
      showSnackbar('Failed to load inactive employees. Please try again.');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllCustomers = async () => {
    try {
      setLoading(true);
      console.log('Fetching all customers...');
      
      const result = await getAllCustomers();
      console.log('Customers fetch result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('Customers fetched successfully:', result.data);
        setUsers(Array.isArray(result.data) ? result.data : []);
        setFilteredUsers(Array.isArray(result.data) ? result.data : []);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch customers';
        console.error('Fetch customers failed:', errorMessage);
        showSnackbar(errorMessage);
        setUsers([]);
        setFilteredUsers([]);
      }
      
    } catch (error) {
      console.error('Error fetching customers:', error);
      showSnackbar('Failed to load customers. Please try again.');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggleEmployeeStatus = async (user) => {
    try {
      setActionLoading(true);
      console.log('Toggling employee status for:', user.email, 'Current status:', user.is_active);
      
      // Toggle the status: if currently active (1), make inactive (0), and vice versa
      const newStatus = user.is_active === 1 ? 0 : 1;
      console.log('New status will be:', newStatus);
      
      const result = await toggleEmployeeStatus(user.email, newStatus);
      console.log('Toggle status result:', result);

      if (result && (result.success || result.status === 'success')) {
        const statusText = newStatus === 1 ? 'activated' : 'deactivated';
        showSnackbar(result.message || `Employee ${statusText} successfully`);
        handleRefresh();
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to update employee status';
        console.error('Toggle employee status failed:', errorMessage);
        showSnackbar(errorMessage);
      }
      
    } catch (error) {
      console.error('Error toggling employee status:', error);
      showSnackbar('Failed to update employee status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUserRole = async () => {
    try {
      setActionLoading(true);
      console.log('Updating user role for:', selectedUser.user_id, 'to:', newRole);
      
      const result = await updateUserRole(selectedUser.user_id, newRole);
      console.log('Update role result:', result);

      if (result && (result.success || result.status === 'success')) {
        showSnackbar(result.message || 'User role updated successfully');
        setRoleDialogVisible(false);
        setNewRole('');
        handleRefresh();
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to update user role';
        console.error('Update user role failed:', errorMessage);
        showSnackbar(errorMessage);
      }
      
    } catch (error) {
      console.error('Error updating user role:', error);
      showSnackbar('Failed to update user role. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.User_role?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleRefresh = () => {
    console.log('Refreshing users...');
    setRefreshing(true);
    if (selectedFilter === 'employees') {
      fetchAllEmployees();
    } else if (selectedFilter === 'inactive') {
      fetchInactiveEmployees();
    } else if (selectedFilter === 'customers') {
      fetchAllCustomers();
    }
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setSearchQuery('');
    
    if (filter === 'employees') {
      fetchAllEmployees();
    } else if (filter === 'inactive') {
      fetchInactiveEmployees();
    } else if (filter === 'customers') {
      fetchAllCustomers();
    }
  };

  const handleUserDetails = (user) => {
    setSelectedUser(user);
    setDetailsDialogVisible(true);
  };

  const handleRoleChange = (user) => {
    setSelectedUser(user);
    setNewRole(user.User_role);
    setRoleDialogVisible(true);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString();
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return theme.colors.error;
      case 'employee':
        return theme.colors.primary;
      case 'customer':
        return theme.colors.tertiary;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusColor = (isActive) => {
    return isActive === 1 ? theme.colors.primary : theme.colors.outline;
  };

  const getStatusText = (isActive) => {
    return isActive === 1 ? 'Active' : 'Inactive';
  };

  const toggleMenu = (userId) => {
    setMenuVisible(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const renderUserItem = ({ item, index }) => (
    <Card key={item.user_id || index} style={userScreenStyles.userCard}>
      <Card.Content>
        <View style={userScreenStyles.userHeader}>
          <View style={userScreenStyles.userInfo}>
            <View style={userScreenStyles.userBasicInfo}>
              <Text style={userScreenStyles.userName}>{item.name || 'Unknown User'}</Text>
              <Text style={userScreenStyles.userEmail}>{item.email || 'No email'}</Text>
              <Text style={userScreenStyles.userPhone}>{item.phone || 'No phone'}</Text>
            </View>
            <View style={userScreenStyles.userMetaInfo}>
              <View style={userScreenStyles.badgeContainer}>
                <Badge style={[userScreenStyles.roleBadge, { backgroundColor: getRoleColor(item.User_role) }]}>
                  {item.User_role || 'CUSTOMER'}
                </Badge>
                <Badge style={[userScreenStyles.statusBadge, { backgroundColor: getStatusColor(item.is_active) }]}>
                  {getStatusText(item.is_active)}
                </Badge>
              </View>
              <Text style={userScreenStyles.joinDate}>
                Joined: {formatDateTime(item.created_at)}
              </Text>
            </View>
          </View>
          <View style={userScreenStyles.userActions}>
            <IconButton
              icon="eye"
              size={20}
              onPress={() => handleUserDetails(item)}
            />
            <Menu
              visible={menuVisible[item.user_id] || false}
              onDismiss={() => toggleMenu(item.user_id)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => toggleMenu(item.user_id)}
                />
              }
            >
              <Menu.Item
                leadingIcon="account-edit"
                onPress={() => {
                  toggleMenu(item.user_id);
                  handleRoleChange(item);
                }}
                title="Change Role"
              />
              {(item.User_role === 'EMPLOYEE' || item.User_role === 'ADMIN') && (
                <Menu.Item
                  leadingIcon={item.is_active === 1 ? "account-off" : "account-check"}
                  onPress={() => {
                    toggleMenu(item.user_id);
                    handleToggleEmployeeStatus(item);
                  }}
                  title={item.is_active === 1 ? "Deactivate" : "Activate"}
                />
              )}
            </Menu>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading users...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={userScreenStyles.searchContainer}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={userScreenStyles.searchBar}
        />
      </View>

      <View style={userScreenStyles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip 
            selected={selectedFilter === 'employees'}
            onPress={() => handleFilterChange('employees')}
            style={userScreenStyles.filterChip}
          >
            Active Employees
          </Chip>
          <Chip 
            selected={selectedFilter === 'inactive'}
            onPress={() => handleFilterChange('inactive')}
            style={userScreenStyles.filterChip}
          >
            Inactive Employees
          </Chip>
          <Chip 
            selected={selectedFilter === 'customers'}
            onPress={() => handleFilterChange('customers')}
            style={userScreenStyles.filterChip}
          >
            Customers
          </Chip>
        </ScrollView>
      </View>

      {filteredUsers.length === 0 ? (
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.noDataText}>No users found</Text>
            <Text style={styles.noDataSubText}>
              {selectedFilter === 'employees' && 'No active employees found'}
              {selectedFilter === 'inactive' && 'No inactive employees found'}
              {selectedFilter === 'customers' && 'No customers found'}
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item, index) => item.user_id?.toString() || index.toString()}
          contentContainerStyle={userScreenStyles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      <Portal>
        <Dialog 
          visible={detailsDialogVisible} 
          onDismiss={() => setDetailsDialogVisible(false)}
          style={userScreenStyles.detailsDialog}
        >
          <Dialog.Title>User Details</Dialog.Title>
          <Dialog.Content>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedUser && (
                <View>
                  <List.Item
                    title="User ID"
                    description={selectedUser.user_id?.toString() || 'N/A'}
                    left={props => <List.Icon {...props} icon="identifier" />}
                  />
                  <Divider />
                  <List.Item
                    title="Name"
                    description={selectedUser.name || 'Not provided'}
                    left={props => <List.Icon {...props} icon="account" />}
                  />
                  <Divider />
                  <List.Item
                    title="Email"
                    description={selectedUser.email || 'Not provided'}
                    left={props => <List.Icon {...props} icon="email" />}
                  />
                  <Divider />
                  <List.Item
                    title="Phone"
                    description={selectedUser.phone || 'Not provided'}
                    left={props => <List.Icon {...props} icon="phone" />}
                  />
                  <Divider />
                  <List.Item
                    title="Role"
                    description={selectedUser.User_role || 'Not specified'}
                    left={props => <List.Icon {...props} icon="account-badge" />}
                  />
                  <Divider />
                  <List.Item
                    title="Status"
                    description={getStatusText(selectedUser.is_active)}
                    left={props => <List.Icon {...props} icon={selectedUser.is_active === 1 ? "check-circle" : "close-circle"} />}
                  />
                  <Divider />
                  <List.Item
                    title="Created At"
                    description={formatDateTime(selectedUser.created_at)}
                    left={props => <List.Icon {...props} icon="calendar" />}
                  />
                </View>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setDetailsDialogVisible(false)}
            >
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog 
          visible={roleDialogVisible} 
          onDismiss={() => setRoleDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Change User Role</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Change role for: {selectedUser?.name} ({selectedUser?.email})
            </Text>
            <View style={userScreenStyles.roleSelection}>
              <Text style={styles.inputLabel}>Select New Role:</Text>
              <View style={userScreenStyles.roleButtons}>
                {['ADMIN', 'EMPLOYEE', 'CUSTOMER'].map((role) => (
                  <ToggleButton
                    key={role}
                    icon={
                      role === 'ADMIN' ? 'shield-account' :
                      role === 'EMPLOYEE' ? 'account-tie' :
                      role === 'CUSTOMER' ? 'account' :
                      'account'
                    }
                    value={role}
                    status={newRole === role ? 'checked' : 'unchecked'}
                    onPress={() => setNewRole(role)}
                    style={userScreenStyles.roleButton}
                  />
                ))}
              </View>
              <View style={userScreenStyles.roleLabels}>
                {['ADMIN', 'EMPLOYEE', 'CUSTOMER'].map((role) => (
                  <Text 
                    key={role} 
                    style={[
                      userScreenStyles.roleLabel,
                      newRole === role && userScreenStyles.selectedRoleLabel
                    ]}
                  >
                    {role}
                  </Text>
                ))}
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setRoleDialogVisible(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button 
              mode="contained"
              onPress={handleUpdateUserRole}
              loading={actionLoading}
              disabled={!newRole || newRole === selectedUser?.User_role}
            >
              Update Role
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'Dismiss',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
      <BottomNavigation navigation={navigation} activeRoute="Employee" />
    </SafeAreaView>
  );
};

const userScreenStyles = StyleSheet.create({
  searchContainer: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  userCard: {
    marginBottom: 12,
    elevation: 2,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userBasicInfo: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: theme.colors.text,
  },
  userMetaInfo: {
    gap: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    color: theme.colors.onPrimary,
  },
  statusBadge: {
    color: theme.colors.onPrimary,
  },
  joinDate: {
    fontSize: 12,
    color: theme.colors.outline,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsDialog: {
    maxHeight: '80%',
  },
  roleSelection: {
    marginTop: 16,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
    marginBottom: 8,
  },
  roleButton: {
    borderRadius: 8,
  },
  roleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  roleLabel: {
    fontSize: 12,
    color: theme.colors.outline,
    textAlign: 'center',
  },
  selectedRoleLabel: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
});

export default AdminEmployeeScreen;