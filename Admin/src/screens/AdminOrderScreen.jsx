import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Button,
  Card,
  Title,
  Snackbar,
  Dialog,
  Portal,
  ActivityIndicator,
  IconButton,
  Divider,
  Chip,
  ProgressBar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  getAllOrders, 
  getDashboardSummary, 
  getOrderDetails, 
  updateOrderStatus, 
  getCustomerOrders 
} from '../services/adminOrder';
import { getCache } from '../utils/auth';
import { theme } from '../theme/theme';
import BottomNavigation from '../navigation/BottomNavigation';

const AdminOrderScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdateVisible, setStatusUpdateVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState('summary');

  const fetchDashboardSummary = async () => {
    try {
      console.log('Fetching dashboard summary...');
      const result = await getDashboardSummary();
      console.log('Dashboard summary result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('Dashboard summary fetched successfully:', result.data);
        setDashboardSummary(result.data);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch dashboard summary';
        console.error('Fetch dashboard summary failed:', errorMessage);
        showSnackbar(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      showSnackbar('Failed to load dashboard summary. Please try again.');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching all orders...');
      
      const cachedData = await getCache();
      if (!cachedData || !cachedData.token) {
        console.log('No cached token found, redirecting to login');
        navigation.replace('Login');
        return;
      }

      const result = await getAllOrders();
      console.log('Orders fetch result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('Orders fetched successfully:', result.data);
        setOrders(Array.isArray(result.data) ? result.data : []);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch orders';
        console.error('Fetch orders failed:', errorMessage);
        showSnackbar(errorMessage);
        setOrders([]);
      }
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      showSnackbar('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      console.log('Fetching customer orders...');
      const result = await getCustomerOrders();
      console.log('Customer orders result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('Customer orders fetched successfully:', result.data);
        setCustomerOrders(Array.isArray(result.data) ? result.data : []);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch customer orders';
        console.error('Fetch customer orders failed:', errorMessage);
        showSnackbar(errorMessage);
        setCustomerOrders([]);
      }
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      showSnackbar('Failed to load customer orders. Please try again.');
      setCustomerOrders([]);
    }
  };

  useEffect(() => {
    fetchDashboardSummary();
    fetchOrders();
    fetchCustomerOrders();
  }, []);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleRefresh = () => {
    console.log('Refreshing orders...');
    setRefreshing(true);
    fetchDashboardSummary();
    fetchOrders();
    fetchCustomerOrders();
  };

  const handleOrderDetails = async (order) => {
    try {
      setSubmitLoading(true);
      console.log('Fetching order details for:', order.order_id);
      
      const result = await getOrderDetails(order.order_id);
      console.log('Order details result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        setSelectedOrder({ ...order, details: result.data });
        setOrderDetailsVisible(true);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch order details';
        showSnackbar(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      showSnackbar('Failed to load order details. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setSubmitLoading(true);
      console.log('Updating order status:', orderId, newStatus);

      const result = await updateOrderStatus(orderId, newStatus);
      console.log('Update status result:', result);

      if (result && (result.success || result.status === 'success')) {
        showSnackbar('Order status updated successfully');
        setStatusUpdateVisible(false);
        fetchOrders();
        fetchDashboardSummary();
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to update order status';
        showSnackbar(errorMessage);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showSnackbar('Failed to update order status. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return theme.colors.warning;
      case 'delivered':
        return theme.colors.success;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.surface;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toFixed(2)}`;
  };

  const renderDashboardSummary = () => (
    <ScrollView style={localStyles.container}>
      <Title style={localStyles.title}>Admin Dashboard</Title>
      
      <View style={localStyles.summaryGrid}>
        <Card style={localStyles.summaryCard}>
          <Card.Content>
            <View style={localStyles.summaryItem}>
              <Text style={localStyles.summaryNumber}>
                {dashboardSummary.total_orders || 0}
              </Text>
              <Text style={localStyles.summaryLabel}>Total Orders</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={localStyles.summaryCard}>
          <Card.Content>
            <View style={localStyles.summaryItem}>
              <Text style={localStyles.summaryNumber}>
                {dashboardSummary.pending_orders || 0}
              </Text>
              <Text style={localStyles.summaryLabel}>Pending Orders</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={localStyles.summaryCard}>
          <Card.Content>
            <View style={localStyles.summaryItem}>
              <Text style={localStyles.summaryNumber}>
                {dashboardSummary.delivered_orders || 0}
              </Text>
              <Text style={localStyles.summaryLabel}>Delivered Orders</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={localStyles.summaryCard}>
          <Card.Content>
            <View style={localStyles.summaryItem}>
              <Text style={localStyles.summaryNumber}>
                {formatCurrency(dashboardSummary.total_revenue)}
              </Text>
              <Text style={localStyles.summaryLabel}>Total Revenue</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={localStyles.summaryCard}>
          <Card.Content>
            <View style={localStyles.summaryItem}>
              <Text style={localStyles.summaryNumber}>
                {dashboardSummary.total_customers || 0}
              </Text>
              <Text style={localStyles.summaryLabel}>Total Customers</Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );

  const renderOrdersList = () => (
    <ScrollView style={localStyles.container}>
      <Title style={localStyles.title}>All Orders</Title>
      
      {loading ? (
        <ActivityIndicator size="large" style={localStyles.loading} />
      ) : orders.length === 0 ? (
        <Card style={localStyles.emptyCard}>
          <Card.Content>
            <Text style={localStyles.emptyText}>No orders found</Text>
          </Card.Content>
        </Card>
      ) : (
        orders.map((order) => (
          <Card key={order.order_id} style={localStyles.orderCard}>
            <Card.Content>
              <View style={localStyles.orderHeader}>
                <View style={localStyles.orderInfo}>
                  <Text style={localStyles.orderId}>Order #{order.order_id}</Text>
                  <Text style={localStyles.customerName}>
                    {order.customer_name || 'Unknown Customer'}
                  </Text>
                </View>
                <Chip 
                  style={[localStyles.statusChip, { backgroundColor: getStatusColor(order.order_status) }]}
                  textStyle={localStyles.statusText}
                >
                  {order.order_status || 'PENDING'}
                </Chip>
              </View>

              <Divider style={localStyles.divider} />

              <View style={localStyles.orderDetails}>
                <Text style={localStyles.orderDetail}>
                  Amount: {formatCurrency(order.total_amount)}
                </Text>
                <Text style={localStyles.orderDetail}>
                  Date: {formatDate(order.order_date)}
                </Text>
                <Text style={localStyles.orderDetail}>
                  Email: {order.customer_email || 'N/A'}
                </Text>
                <Text style={localStyles.orderDetail}>
                  Address: {order.building ? `${order.building}, ${order.area}, ${order.pincode}` : 'N/A'}
                </Text>
              </View>

              <View style={localStyles.orderActions}>
                <Button
                  mode="outlined"
                  onPress={() => handleOrderDetails(order)}
                  style={localStyles.actionButton}
                >
                  View Details
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setSelectedOrder(order);
                    setStatusUpdateVisible(true);
                  }}
                  style={localStyles.actionButton}
                >
                  Update Status
                </Button>
                
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );

  const renderCustomerOrders = () => (
    <ScrollView style={localStyles.container}>
      <Title style={localStyles.title}>Customer Orders</Title>
      
      {customerOrders.length === 0 ? (
        <Card style={localStyles.emptyCard}>
          <Card.Content>
            <Text style={localStyles.emptyText}>No customer orders found</Text>
          </Card.Content>
        </Card>
      ) : (
        customerOrders.map((order) => (
          <Card key={order.order_id} style={localStyles.orderCard}>
            <Card.Content>
              <View style={localStyles.orderHeader}>
                <View style={localStyles.orderInfo}>
                  <Text style={localStyles.orderId}>Order #{order.order_id}</Text>
                  <Text style={localStyles.customerName}>
                    {order.customer_name || 'Unknown Customer'}
                  </Text>
                </View>
                <Chip 
                  style={[localStyles.statusChip, { backgroundColor: getStatusColor(order.order_status) }]}
                  textStyle={localStyles.statusText}
                >
                  {order.order_status || 'PENDING'}
                </Chip>
              </View>

              <Divider style={localStyles.divider} />

              <View style={localStyles.orderDetails}>
                <Text style={localStyles.orderDetail}>
                  Amount: {formatCurrency(order.total_amount)}
                </Text>
                <Text style={localStyles.orderDetail}>
                  Date: {formatDate(order.order_date)}
                </Text>
                <Text style={localStyles.orderDetail}>
                  Email: {order.customer_email || 'N/A'}
                </Text>
              </View>

              <View style={localStyles.orderActions}>
                <Button
                  mode="outlined"
                  onPress={() => handleOrderDetails(order)}
                  style={localStyles.actionButton}
                >
                  View Details
                </Button>
              </View>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );

  const renderContent = () => {
    switch (currentTab) {
      case 'summary':
        return renderDashboardSummary();
      case 'orders':
        return renderOrdersList();
      case 'customers':
        return renderCustomerOrders();
      default:
        return renderDashboardSummary();
    }
  };

  return (
    <SafeAreaView style={localStyles.safeArea}>
      <View style={localStyles.header}>
        <View style={localStyles.tabContainer}>
          <Button
            mode={currentTab === 'summary' ? 'contained' : 'outlined'}
            onPress={() => setCurrentTab('summary')}
            style={localStyles.tabButton}
          >
            Summary
          </Button>
          <Button
            mode={currentTab === 'orders' ? 'contained' : 'outlined'}
            onPress={() => setCurrentTab('orders')}
            style={localStyles.tabButton}
          >
            Orders
          </Button>
          <Button
            mode={currentTab === 'customers' ? 'contained' : 'outlined'}
            onPress={() => setCurrentTab('customers')}
            style={localStyles.tabButton}
          >
            Customers
          </Button>
        </View>
        
        <IconButton
          icon="refresh"
          onPress={handleRefresh}
          disabled={refreshing}
        />
      </View>

      {refreshing && <ProgressBar indeterminate />}

      {renderContent()}

      <Portal>
        <Dialog
          visible={orderDetailsVisible}
          onDismiss={() => setOrderDetailsVisible(false)}
          style={localStyles.dialog}
        >
          <Dialog.Title>Order Details</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={localStyles.dialogContent}>
              {selectedOrder && (
                <View>
                  <Text style={localStyles.detailLabel}>Order ID:</Text>
                  <Text style={localStyles.detailValue}>{selectedOrder.order_id}</Text>
                  
                  <Text style={localStyles.detailLabel}>Customer:</Text>
                  <Text style={localStyles.detailValue}>{selectedOrder.customer_name || 'N/A'}</Text>
                  
                  <Text style={localStyles.detailLabel}>Email:</Text>
                  <Text style={localStyles.detailValue}>{selectedOrder.customer_email || 'N/A'}</Text>
                  
                  <Text style={localStyles.detailLabel}>Phone:</Text>
                  <Text style={localStyles.detailValue}>{selectedOrder.details?.customer_phone || 'N/A'}</Text>
                  
                  <Text style={localStyles.detailLabel}>Amount:</Text>
                  <Text style={localStyles.detailValue}>{formatCurrency(selectedOrder.total_amount)}</Text>
                  
                  <Text style={localStyles.detailLabel}>Status:</Text>
                  <Chip 
                    style={[localStyles.statusChip, { backgroundColor: getStatusColor(selectedOrder.order_status) }]}
                    textStyle={localStyles.statusText}
                  >
                    {selectedOrder.order_status || 'PENDING'}
                  </Chip>
                  
                  <Text style={localStyles.detailLabel}>Order Date:</Text>
                  <Text style={localStyles.detailValue}>{formatDate(selectedOrder.order_date)}</Text>
                  
                  <Text style={localStyles.detailLabel}>Address:</Text>
                  <Text style={localStyles.detailValue}>
                    {selectedOrder.building ? `${selectedOrder.building}, ${selectedOrder.area}, ${selectedOrder.pincode}` : 'N/A'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setOrderDetailsVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={statusUpdateVisible}
          onDismiss={() => setStatusUpdateVisible(false)}
          style={localStyles.dialog}
        >
          <Dialog.Title>Update Order Status</Dialog.Title>
          <Dialog.Content>
            <Text style={localStyles.dialogText}>
              Select new status for Order #{selectedOrder?.order_id}
            </Text>
            <View style={localStyles.statusButtons}>
              {['PENDING', 'DELIVERED', 'CANCELLED'].map((status) => (
                <Button
                  key={status}
                  mode="outlined"
                  onPress={() => handleUpdateStatus(selectedOrder?.order_id, status)}
                  style={[localStyles.statusButton]}
                  disabled={submitLoading}
                >
                  {status}
                </Button>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setStatusUpdateVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {submitLoading && (
        <View style={localStyles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={localStyles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
      <BottomNavigation navigation={navigation} activeRoute="Order" />
    </SafeAreaView>
  );
};

const localStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    elevation: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    minWidth: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryCard: {
    width: '48%',
    minHeight: 100,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  summaryLabel: {
    fontSize: 12,

    textAlign: 'center',
    marginTop: 4,
  },
  orderCard: {
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 14,

  },
  statusChip: {
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  orderDetails: {
    marginBottom: 16,
  },
  orderDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  emptyCard: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
 
  },
  loading: {
    marginTop: 32,
  },
  dialog: {
    maxHeight: '80%',
  },
  dialogContent: {
    paddingHorizontal: 24,
  },
  dialogText: {
    fontSize: 16,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    marginBottom: 8,
  },
  statusButtons: {
    gap: 8,
  },
  statusButton: {
    marginVertical: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
   
    justifyContent: 'center',
    alignItems: 'center',
  },
  snackbar: {
    backgroundColor: theme.colors.surface,
  },
});

export default AdminOrderScreen;
