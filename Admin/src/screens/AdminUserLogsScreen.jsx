// src/screens/AdminUserLogsScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
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
  Badge
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllUserLogs, getUserLogsByUserId, getTodayUserLogs } from '../services/adminUserLogDetails';
import { getCache } from '../utils/auth';
import { styles } from '../theme/styles';
import { theme } from '../theme/theme';
import BottomNavigation from '../navigation/BottomNavigation';

const AdminUserLogsScreen = ({ navigation }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [detailsDialogVisible, setDetailsDialogVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'today', 'user'
  const [userIdFilter, setUserIdFilter] = useState('');
  const [userSearchDialogVisible, setUserSearchDialogVisible] = useState(false);

  // Fetch all user logs
  const fetchAllUserLogs = async () => {
    try {
      setLoading(true);
      console.log('Fetching all user logs...');
      
      // Check if user is authenticated and has admin role
      const cachedData = await getCache();
      if (!cachedData || !cachedData.token) {
        console.log('No cached token found, redirecting to login');
        navigation.replace('Login');
        return;
      }

      const result = await getAllUserLogs();
      console.log('User logs fetch result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('User logs fetched successfully:', result.data);
        setLogs(Array.isArray(result.data) ? result.data : []);
        setFilteredLogs(Array.isArray(result.data) ? result.data : []);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch user logs';
        console.error('Fetch user logs failed:', errorMessage);
        showSnackbar(errorMessage);
        setLogs([]);
        setFilteredLogs([]);
      }
      
    } catch (error) {
      console.error('Error fetching user logs:', error);
      showSnackbar('Failed to load user logs. Please try again.');
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch today's user logs
  const fetchTodayUserLogs = async () => {
    try {
      setLoading(true);
      console.log('Fetching today\'s user logs...');
      
      const result = await getTodayUserLogs();
      console.log('Today\'s user logs fetch result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('Today\'s user logs fetched successfully:', result.data);
        setLogs(Array.isArray(result.data) ? result.data : []);
        setFilteredLogs(Array.isArray(result.data) ? result.data : []);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch today\'s user logs';
        console.error('Fetch today\'s user logs failed:', errorMessage);
        showSnackbar(errorMessage);
        setLogs([]);
        setFilteredLogs([]);
      }
      
    } catch (error) {
      console.error('Error fetching today\'s user logs:', error);
      showSnackbar('Failed to load today\'s user logs. Please try again.');
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch user logs by user ID
  const fetchUserLogsByUserId = async (userId) => {
    try {
      setLoading(true);
      console.log('Fetching user logs for user ID:', userId);
      
      const result = await getUserLogsByUserId(userId);
      console.log('User logs by user ID fetch result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('User logs by user ID fetched successfully:', result.data);
        setLogs(Array.isArray(result.data) ? result.data : []);
        setFilteredLogs(Array.isArray(result.data) ? result.data : []);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch user logs';
        console.error('Fetch user logs by user ID failed:', errorMessage);
        showSnackbar(errorMessage);
        setLogs([]);
        setFilteredLogs([]);
      }
      
    } catch (error) {
      console.error('Error fetching user logs by user ID:', error);
      showSnackbar('Failed to load user logs. Please try again.');
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllUserLogs();
  }, []);

  useEffect(() => {
    // Filter logs based on search query
    if (searchQuery.trim() === '') {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter(log => 
        log.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action_details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ip_address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLogs(filtered);
    }
  }, [searchQuery, logs]);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleRefresh = () => {
    console.log('Refreshing user logs...');
    setRefreshing(true);
    if (selectedFilter === 'all') {
      fetchAllUserLogs();
    } else if (selectedFilter === 'today') {
      fetchTodayUserLogs();
    } else if (selectedFilter === 'user' && userIdFilter) {
      fetchUserLogsByUserId(userIdFilter);
    } else {
      fetchAllUserLogs();
    }
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setSearchQuery('');
    
    if (filter === 'all') {
      fetchAllUserLogs();
    } else if (filter === 'today') {
      fetchTodayUserLogs();
    } else if (filter === 'user') {
      setUserSearchDialogVisible(true);
    }
  };

  const handleUserSearch = () => {
    if (userIdFilter.trim()) {
      fetchUserLogsByUserId(userIdFilter.trim());
      setUserSearchDialogVisible(false);
    }
  };

  const handleLogDetails = (log) => {
    setSelectedLog(log);
    setDetailsDialogVisible(true);
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString();
  };

  const getActionTypeColor = (actionType) => {
    switch (actionType?.toLowerCase()) {
      case 'login':
        return theme.colors.primary;
      case 'logout':
        return theme.colors.secondary;
      case 'create':
      case 'add':
        return theme.colors.tertiary;
      case 'update':
      case 'edit':
        return theme.colors.warning;
      case 'delete':
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  const renderLogItem = ({ item, index }) => (
    <Card key={item.log_id || index} style={userLogsStyles.logCard}>
      <Card.Content>
        <View style={userLogsStyles.logHeader}>
          <View style={userLogsStyles.logInfo}>
            <View style={userLogsStyles.userInfo}>
              <Text style={userLogsStyles.userName}>{item.user_name || 'Unknown User'}</Text>
              <Text style={userLogsStyles.userEmail}>{item.user_email || 'No email'}</Text>
              {item.user_role && (
                <Badge style={userLogsStyles.roleBadge}>{item.user_role}</Badge>
              )}
            </View>
            <View style={userLogsStyles.actionInfo}>
              <Chip 
                style={[userLogsStyles.actionChip, { backgroundColor: getActionTypeColor(item.action_type) }]}
                textStyle={{ color: 'white', fontSize: 12 }}
              >
                {item.action_type || 'Unknown'}
              </Chip>
              <Text style={userLogsStyles.actionDetails} numberOfLines={2}>
                {item.action_details || 'No details'}
              </Text>
            </View>
            <View style={userLogsStyles.metaInfo}>
              <Text style={userLogsStyles.ipAddress}>IP: {item.ip_address || 'N/A'}</Text>
              <Text style={userLogsStyles.logTime}>{formatDateTime(item.log_time)}</Text>
            </View>
          </View>
          <View style={userLogsStyles.logActions}>
            <IconButton
              icon="eye"
              size={20}
              onPress={() => handleLogDetails(item)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading user logs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={userLogsStyles.searchContainer}>
        <Searchbar
          placeholder="Search logs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={userLogsStyles.searchBar}
        />
      </View>

      {/* Filter Chips */}
      <View style={userLogsStyles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip 
            selected={selectedFilter === 'all'}
            onPress={() => handleFilterChange('all')}
            style={userLogsStyles.filterChip}
          >
            All Logs
          </Chip>
          <Chip 
            selected={selectedFilter === 'today'}
            onPress={() => handleFilterChange('today')}
            style={userLogsStyles.filterChip}
          >
            Today's Logs
          </Chip>
          <Chip 
            selected={selectedFilter === 'user'}
            onPress={() => handleFilterChange('user')}
            style={userLogsStyles.filterChip}
          >
            By User ID
          </Chip>
        </ScrollView>
      </View>

      {/* Logs List */}
      {filteredLogs.length === 0 ? (
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text style={styles.noDataText}>No user logs found</Text>
            <Text style={styles.noDataSubText}>
              {selectedFilter === 'today' ? 'No activity recorded today' : 'No logs available for the selected filter'}
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={filteredLogs}
          renderItem={renderLogItem}
          keyExtractor={(item, index) => item.log_id?.toString() || index.toString()}
          contentContainerStyle={userLogsStyles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}

      {/* User Search Dialog */}
      <Portal>
        <Dialog 
          visible={userSearchDialogVisible} 
          onDismiss={() => setUserSearchDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title>Search Logs by User ID</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="User ID"
              value={userIdFilter}
              onChangeText={setUserIdFilter}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              placeholder="Enter user ID"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setUserSearchDialogVisible(false)}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleUserSearch}
              mode="contained"
              disabled={!userIdFilter.trim()}
            >
              Search
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Log Details Dialog */}
      <Portal>
        <Dialog 
          visible={detailsDialogVisible} 
          onDismiss={() => setDetailsDialogVisible(false)}
          style={userLogsStyles.detailsDialog}
        >
          <Dialog.Title>Log Details</Dialog.Title>
          <Dialog.Content>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedLog && (
                <View>
                  <List.Item
                    title="Log ID"
                    description={selectedLog.log_id?.toString() || 'N/A'}
                    left={props => <List.Icon {...props} icon="identifier" />}
                  />
                  <Divider />
                  <List.Item
                    title="User"
                    description={`${selectedLog.user_name || 'Unknown'} (${selectedLog.user_email || 'No email'})`}
                    left={props => <List.Icon {...props} icon="account" />}
                  />
                  <Divider />
                  <List.Item
                    title="User Role"
                    description={selectedLog.user_role || 'Not specified'}
                    left={props => <List.Icon {...props} icon="account-badge" />}
                  />
                  <Divider />
                  <List.Item
                    title="Action Type"
                    description={selectedLog.action_type || 'Unknown'}
                    left={props => <List.Icon {...props} icon="play" />}
                  />
                  <Divider />
                  <List.Item
                    title="Action Details"
                    description={selectedLog.action_details || 'No details available'}
                    left={props => <List.Icon {...props} icon="text" />}
                  />
                  <Divider />
                  <List.Item
                    title="IP Address"
                    description={selectedLog.ip_address || 'N/A'}
                    left={props => <List.Icon {...props} icon="ip-network" />}
                  />
                  <Divider />
                  <List.Item
                    title="Log Time"
                    description={formatDateTime(selectedLog.log_time)}
                    left={props => <List.Icon {...props} icon="clock" />}
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

      {/* Snackbar for feedback */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
      <BottomNavigation navigation={navigation} activeRoute="UserLogs" />
    </SafeAreaView>
  );
};

// Styles specific to user logs screen
const userLogsStyles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
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
  logCard: {
    marginBottom: 12,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logInfo: {
    flex: 1,
    marginRight: 10,
  },
  logActions: {
    flexDirection: 'row',
  },
  userInfo: {
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    fontSize: 10,
  },
  actionInfo: {
    marginBottom: 8,
  },
  actionChip: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  actionDetails: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ipAddress: {
    fontSize: 12,
    color: theme.colors.outline,
  },
  logTime: {
    fontSize: 12,
    color: theme.colors.outline,
  },
  detailsDialog: {
    maxHeight: '80%',
  },
});

export default AdminUserLogsScreen;