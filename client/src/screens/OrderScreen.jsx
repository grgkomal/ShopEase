// src/screens/OrderScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import {
  Text,
  Button,
  Card,
  Title,
  Snackbar,
  Dialog,
  Portal,
  ActivityIndicator,
  FAB,
  IconButton,
  Divider,
  Badge,
  Surface,
  Chip
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  getOrders, 
  getOrderDetails, 
  createOrder,
  formatOrderDate,
  formatCurrency,
  formatOrderAddress
} from '../services/order';
import { getAddresses } from '../services/address';
import { getCache } from '../utils/auth';
import { styles } from '../theme/styles';
import { theme } from '../theme/theme';
import { useFocusEffect } from '@react-navigation/native';

const OrderScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [createOrderDialogVisible, setCreateOrderDialogVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching user orders...');
      
      const cachedData = await getCache();
      if (!cachedData || !cachedData.token) {
        console.log('No cached token found, redirecting to login');
        navigation.replace('Login');
        return;
      }

      const result = await getOrders();
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

  const fetchAddresses = async () => {
    try {
      console.log('Fetching delivery addresses...');
      const result = await getAddresses();
      console.log('Addresses fetch result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('Addresses fetched successfully:', result.data);
        setAddresses(Array.isArray(result.data) ? result.data : []);
      } else {
        console.error('Failed to fetch addresses');
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setOrderDetailsLoading(true);
      console.log('Fetching order details for ID:', orderId);
      
      const result = await getOrderDetails(orderId);
      console.log('Order details fetch result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('Order details fetched successfully:', result.data);
        setSelectedOrder(result.data);
        setOrderDetailsVisible(true);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch order details';
        console.error('Fetch order details failed:', errorMessage);
        showSnackbar(errorMessage);
      }
      
    } catch (error) {
      console.error('Error fetching order details:', error);
      showSnackbar('Failed to load order details. Please try again.');
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedAddressId) {
      showSnackbar('Please select a delivery address');
      return;
    }

    try {
      setSubmitLoading(true);
      console.log('Creating new order...');

      const orderData = {
        address_id: selectedAddressId
      };

      console.log('Order data to create:', orderData);

      const result = await createOrder(orderData);
      console.log('Create order result:', result);

      if (result && (result.success || result.status === 'success')) {
        showSnackbar('Order placed successfully!');
        setCreateOrderDialogVisible(false);
        setSelectedAddressId(null);
        fetchOrders(); 
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to create order';
        console.error('Create order failed:', errorMessage);
        showSnackbar(errorMessage);
      }
      
    } catch (error) {
      console.error('Create order error:', error);
      showSnackbar('Failed to create order. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAddresses();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleRefresh = () => {
    console.log('Refreshing orders...');
    setRefreshing(true);
    fetchOrders();
  };

  const handleOrderPress = (order) => {
    fetchOrderDetails(order.order_id);
  };

  const closeOrderDetails = () => {
    setOrderDetailsVisible(false);
    setSelectedOrder(null);
  };

  const closeCreateOrderDialog = () => {
    setCreateOrderDialogVisible(false);
    setSelectedAddressId(null);
  };

  const renderOrderCard = (order, index) => (
    <Card key={order.order_id || index} style={orderStyles.orderCard}>
      <Card.Content style={styles.cardContent}>
        <View style={orderStyles.orderHeader}>
          <View style={orderStyles.orderInfo}>
            <View style={orderStyles.orderIdRow}>
              <Text style={orderStyles.orderIdText}>Order #{order.order_id}</Text>
              <Chip 
                mode="outlined" 
                compact 
                style={orderStyles.statusChip}
                textStyle={orderStyles.statusChipText}
              >
                DELIVERED
              </Chip>
            </View>
            
            <Text style={orderStyles.orderDateText}>
              {formatOrderDate(order.order_date)}
            </Text>
            
            <Text style={orderStyles.addressText}>
              {formatOrderAddress(order)}
            </Text>
            
            <View style={orderStyles.orderSummaryRow}>
              <Text style={orderStyles.itemCountText}>
                {order.item_count || 1} item{(order.item_count || 1) > 1 ? 's' : ''}
              </Text>
              <Text style={orderStyles.totalAmountText}>
                {formatCurrency(order.total_order_amount || order.total_amount)}
              </Text>
            </View>
          </View>
          
          <View style={orderStyles.orderActions}>
            <IconButton
              icon="eye"
              size={20}
              onPress={() => handleOrderPress(order)}
              disabled={orderDetailsLoading}
              style={orderStyles.actionButton}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderOrderDetails = () => {
    if (!selectedOrder) return null;

    return (
      <Portal>
        <Dialog 
          visible={orderDetailsVisible} 
          onDismiss={closeOrderDetails}
          style={orderStyles.detailsDialog}
        >
          <Dialog.Title>Order Details</Dialog.Title>
          <Dialog.Content>
            {orderDetailsLoading ? (
              <View style={styles.centeredContainer}>
                <ActivityIndicator animating={true} size="large" />
                <Text style={{ marginTop: 16 }}>Loading order details...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Surface style={orderStyles.detailsCard} elevation={1}>
                  <Text style={orderStyles.detailsTitle}>Order Information</Text>
                  <Text style={orderStyles.detailsText}>Order ID: #{selectedOrder.order_id}</Text>
                  <Text style={orderStyles.detailsText}>
                    Date: {formatOrderDate(selectedOrder.order_date)}
                  </Text>
                  <Text style={orderStyles.detailsText}>
                    Total: {formatCurrency(selectedOrder.total_amount)}
                  </Text>
                </Surface>

                <Surface style={orderStyles.detailsCard} elevation={1}>
                  <Text style={orderStyles.detailsTitle}>Delivery Address</Text>
                  <Text style={orderStyles.detailsText}>
                    {formatOrderAddress(selectedOrder)}
                  </Text>
                  {selectedOrder.delivery_phone && (
                    <Text style={orderStyles.detailsText}>
                      Phone: {selectedOrder.delivery_phone}
                    </Text>
                  )}
                </Surface>

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <Surface style={orderStyles.detailsCard} elevation={1}>
                    <Text style={orderStyles.detailsTitle}>Order Items</Text>
                    {selectedOrder.items.map((item, index) => (
                      <View key={item.product_id || index} style={orderStyles.itemRow}>
                        <View style={orderStyles.itemInfo}>
                          <Text style={orderStyles.itemName}>{item.product_name}</Text>
                          <Text style={orderStyles.itemDetails}>
                            Qty: {item.quantity} × {formatCurrency(item.price)}
                          </Text>
                        </View>
                        <Text style={orderStyles.itemTotal}>
                          {formatCurrency(item.total_amount)}
                        </Text>
                      </View>
                    ))}
                  </Surface>
                )}
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeOrderDetails}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  const renderCreateOrderDialog = () => (
    <Portal>
      <Dialog 
        visible={createOrderDialogVisible} 
        onDismiss={closeCreateOrderDialog}
        style={orderStyles.createOrderDialog}
      >
        <Dialog.Title>Create New Order</Dialog.Title>
        <Dialog.Content>
          <Text style={orderStyles.dialogSubtitle}>Select delivery address:</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={orderStyles.addressList}>
            {addresses.map((address, index) => (
              <Surface 
                key={address.address_id || index} 
                style={[
                  orderStyles.addressOption,
                  selectedAddressId === address.address_id && orderStyles.selectedAddress
                ]}
                elevation={1}
              >
                <View style={orderStyles.addressContent}>
                  <View style={orderStyles.addressInfo}>
                    {address.is_default && (
                      <Badge style={orderStyles.defaultBadge}>DEFAULT</Badge>
                    )}
                    <Text style={orderStyles.addressText}>
                      {address.building}, {address.area}, {address.pincode}
                    </Text>
                    <Text style={orderStyles.phoneText}>Phone: {address.phone}</Text>
                  </View>
                  <Button
                    mode={selectedAddressId === address.address_id ? "contained" : "outlined"}
                    compact
                    onPress={() => setSelectedAddressId(address.address_id)}
                    style={orderStyles.selectButton}
                  >
                    {selectedAddressId === address.address_id ? "Selected" : "Select"}
                  </Button>
                </View>
              </Surface>
            ))}
          </ScrollView>
          
          <Text style={orderStyles.noteText}>
            * This will create an order from your current cart items
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={closeCreateOrderDialog} disabled={submitLoading}>
            Cancel
          </Button>
          <Button 
            onPress={handleCreateOrder} 
            loading={submitLoading}
            disabled={submitLoading || !selectedAddressId}
            mode="contained"
          >
            Place Order
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading orders...</Text>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {orders.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={orderStyles.noDataText}>No orders found</Text>
              <Text style={orderStyles.noDataSubText}>
                Your order history will appear here once you place your first order
              </Text>
            </Card.Content>
          </Card>
        ) : (
          orders.map((order, index) => renderOrderCard(order, index))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
      {renderOrderDetails()}
      {renderCreateOrderDialog()}
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
   
    </SafeAreaView>
  );
};

// Specific styles for order screen
const orderStyles = StyleSheet.create({
  orderCard: {
    marginBottom: 12,
    marginHorizontal: 16,
    backgroundColor: theme.colors.surface,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {
    flex: 1,
    marginRight: 10,
  },
  orderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
  },
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderIdText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  statusChipText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  orderDateText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCountText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  totalAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  detailsDialog: {
    maxHeight: '80%',
  },
  detailsCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  itemDetails: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  createOrderDialog: {
    maxHeight: '80%',
  },
  dialogSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 12,
  },
  addressList: {
    maxHeight: 300,
  },
  addressOption: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  selectedAddress: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  addressContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
    marginRight: 12,
  },
  defaultBadge: {
    backgroundColor: theme.colors.primary,
    color: theme.colors.onPrimary,
    marginBottom: 4,
  },
  selectButton: {
    minWidth: 80,
  },
  noteText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center'
  }
})


export default OrderScreen