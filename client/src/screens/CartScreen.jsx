// src/screens/CartScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, RefreshControl } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Snackbar,
  HelperText,
  Dialog,
  Portal,
  ActivityIndicator,
  FAB,
  List,
  IconButton,
  Divider,
  Chip,
  Badge,
  RadioButton,
  Surface
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  getCart, 
  updateCartItem, 
  removeCartItem, 
  clearCart, 
  createOrder,
  addToCart, 
  clearCartWithApi
} from '../services/cart';
import { getAddresses } from '../services/address';
import { getCache } from '../utils/auth';
import { styles } from '../theme/styles';
import { theme } from '../theme/theme';

const CartScreen = ({ navigation }) => {
  const [cartData, setCartData] = useState({
    cart_items: [],
    total_amount: 0,
    item_count: 0
  });
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [clearCartDialogVisible, setClearCartDialogVisible] = useState(false);
  const [orderDialogVisible, setOrderDialogVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      console.log('Fetching cart items...');
      const cachedData = await getCache();
      if (!cachedData || !cachedData.token) {
        console.log('No cached token found, redirecting to login');
        navigation.replace('Login');
        return;
      }
      const result = await getCart();
      console.log('Cart fetch result:', result);
      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('Cart fetched successfully:', result.data);
        setCartData({
          cart_items: Array.isArray(result.data.cart_items) ? result.data.cart_items : [],
          total_amount: result.data.total_amount || 0,
          item_count: result.data.item_count || 0
        });
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch cart';
        console.error('Fetch cart failed:', errorMessage);
        showSnackbar(errorMessage);
        setCartData({
          cart_items: [],
          total_amount: 0,
          item_count: 0
        });
      }
      
    } catch (error) {
      console.error('Error fetching cart:', error);
      showSnackbar('Failed to load cart. Please try again.');
      setCartData({
        cart_items: [],
        total_amount: 0,
        item_count: 0
      });
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
        const defaultAddress = result.data.find(addr => addr.is_default);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      } else {
        console.error('Failed to fetch addresses');
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchAddresses();
  }, []);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleQuantityChange = async (cartItem, newQuantity) => {
    if (newQuantity <= 0) {
      handleDeleteItem(cartItem);
      return;
    }

    if (newQuantity > cartItem.available_quantity) {
      showSnackbar(`Only ${cartItem.available_quantity} items available in stock`);
      return;
    }
    try {
      setSubmitLoading(true);
      console.log('Updating cart item quantity...');
      const result = await updateCartItem(cartItem.cart_id, { quantity: newQuantity });
      console.log('Update result:', result);
      if (result && (result.success || result.status === 'success')) {
        showSnackbar('Cart updated successfully');
        fetchCart();
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to update cart item';
        console.error('Update cart item failed:', errorMessage);
        showSnackbar(errorMessage);
      }     
    } catch (error) {
      console.error('Update cart item error:', error);
      showSnackbar('Failed to update cart item. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteItem = (cartItem) => {
    setItemToDelete(cartItem);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setSubmitLoading(true);
      console.log('Removing cart item with ID:', itemToDelete.cart_id);

      const result = await removeCartItem(itemToDelete.cart_id);
      console.log('Delete result:', result);

      if (result && (result.success || result.status === 'success')) {
        showSnackbar('Item removed from cart successfully');
        setDeleteDialogVisible(false);
        setItemToDelete(null);
        fetchCart();
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to remove item';
        console.error('Remove cart item failed:', errorMessage);
        showSnackbar(errorMessage);
      }     
    } catch (error) {
      console.error('Remove cart item error:', error);
      showSnackbar('Failed to remove item. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClearCart = () => {
    if (cartData.cart_items.length === 0) {
      showSnackbar('Your cart is already empty');
      return;
    }
    setClearCartDialogVisible(true);
  };

  const confirmClearCart = async () => {
    try {
      setSubmitLoading(true);
      console.log('Clearing entire cart...');
      let result = await clearCart();
      console.log('Clear cart result (primary):', result);
      if (!result || (!result.success && result.status !== 'success')) {
        console.log('Primary clear cart failed, trying API instance method...');
        result = await clearCartWithApi();
        console.log('Clear cart result (API instance):', result);
      }
      if (!result || (!result.success && result.status !== 'success')) {
        console.log('Both clear methods failed, trying individual deletion...');
        let allDeleted = true;
        
        for (const item of cartData.cart_items) {
          const deleteResult = await removeCartItem(item.cart_id);
          if (!deleteResult || (!deleteResult.success && deleteResult.status !== 'success')) {
            allDeleted = false;
            console.error(`Failed to delete item ${item.cart_id}`);
          }
        }
        
        if (allDeleted) {
          showSnackbar('Cart cleared successfully');
          setClearCartDialogVisible(false);
          fetchCart();
          return;
        }
      }

      if (result && (result.success || result.status === 'success')) {
        showSnackbar('Cart cleared successfully');
        setClearCartDialogVisible(false);
        fetchCart();
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to clear cart';
        console.error('Clear cart failed:', errorMessage);
        showSnackbar(errorMessage);
      }      
    } catch (error) {
      console.error('Clear cart error:', error);
      showSnackbar('Failed to clear cart. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    if (cartData.cart_items.length === 0) {
      showSnackbar('Your cart is empty');
      return;
    }
    setOrderDialogVisible(true);
  };

  const confirmPlaceOrder = async () => {
    if (!selectedAddress) {
      showSnackbar('Please select a delivery address');
      return;
    }

    try {
      setSubmitLoading(true);
      console.log('Placing order...');

      const orderData = {
        address_id: selectedAddress.address_id
      };

      const result = await createOrder(orderData);
      console.log('Order result:', result);

      if (result && (result.success || result.status === 'success')) {
        showSnackbar('Order placed successfully! Cash on Delivery');
        setOrderDialogVisible(false);
        setSelectedAddress(null);
        fetchCart();
        setTimeout(() => {
        navigation.navigate('Order');
        }, 2000);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to place order';
        console.error('Place order failed:', errorMessage);
        showSnackbar(errorMessage);
      }     
    } catch (error) {
      console.error('Place order error:', error);
      showSnackbar('Failed to place order. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRefresh = () => {
    console.log('Refreshing cart...');
    setRefreshing(true);
    fetchCart();
  };

  const formatPrice = (price) => {
    return `₹${parseFloat(price).toFixed(2)}`;
  };

  const formatAddress = (address) => {
    return `${address.building}, ${address.area}, ${address.pincode}`;
  };
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
        <View style={styles.centeredContainer}>
          <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
      <View style={cartStyles.headerContainer}>
        <View style={cartStyles.headerLeft}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor="#fff"
            onPress={() => navigation.goBack()}
            style={cartStyles.backButton}
          />
          <Text style={cartStyles.headerTitle}>Cart</Text>
        </View>
        <Button
          mode="text"
          onPress={handleRefresh}
          loading={refreshing}
          disabled={submitLoading}
          textColor="#fff"
          style={cartStyles.refreshButton}
        >
          Refresh
        </Button>
      </View>

      <ScrollView 
        style={cartStyles.scrollContainer}
        contentContainerStyle={cartStyles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={cartStyles.titleContainer}>
          <Text style={cartStyles.shoppingCartTitle}>Shopping Cart</Text>
          {cartData.item_count > 0 && (
            <Badge size={20} style={cartStyles.itemBadge}>
              {cartData.item_count}
            </Badge>
          )}
        </View>
        {cartData.cart_items.length === 0 ? (
          <View style={cartStyles.emptyCartContainer}>
            <Text style={cartStyles.emptyCartText}>Your cart is empty</Text>
            <Text style={cartStyles.emptyCartSubText}>Add some products to get started</Text>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('Home')}
              style={cartStyles.continueShoppingButton}
            >
              Continue Shopping
            </Button>
          </View>
        ) : (
          <>
            <View style={cartStyles.cartItemsContainer}>
              {cartData.cart_items.map((item, index) => (
                <View key={item.cart_id || index} style={cartStyles.cartItem}>
                  <View style={cartStyles.productImageContainer}>
                    {item.image_url ? (
                      <Image 
                        source={{ uri: item.image_url }} 
                        style={cartStyles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={cartStyles.placeholderImage}>
                        <Text style={cartStyles.placeholderText}>No Image</Text>
                      </View>
                    )}
                  </View>
                  <View style={cartStyles.productDetails}>
                    <Text style={cartStyles.productName}>{item.product_name}</Text>
                    <Text style={cartStyles.productPrice}>{formatPrice(item.price)} each</Text>
                    <Text style={cartStyles.stockInfo}>Available: {item.available_quantity}</Text>
                    <View style={cartStyles.quantityRow}>
                      <View style={cartStyles.quantityControls}>
                        <IconButton
                          icon="minus"
                          size={16}
                          onPress={() => handleQuantityChange(item, item.quantity - 1)}
                          disabled={submitLoading || item.quantity <= 1}
                          style={cartStyles.quantityButton}
                          iconColor="#666"
                        />
                        <Text style={cartStyles.quantityText}>{item.quantity}</Text>
                        <IconButton
                          icon="plus"
                          size={16}
                          onPress={() => handleQuantityChange(item, item.quantity + 1)}
                          disabled={submitLoading || item.quantity >= item.available_quantity}
                          style={cartStyles.quantityButton}
                          iconColor="#666"
                        />
                      </View>
                      <Text style={cartStyles.itemTotal}>Total: {formatPrice(item.item_total)}</Text>
                    </View>
                  </View>
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor="#ff4444"
                    onPress={() => handleDeleteItem(item)}
                    disabled={submitLoading}
                    style={cartStyles.deleteButton}
                  />
                </View>
              ))}
            </View>
            <View style={cartStyles.summaryContainer}>
              <Text style={cartStyles.summaryTitle}>Order Summary</Text>
              <Divider style={cartStyles.divider} />              
              <View style={cartStyles.summaryRow}>
                <Text style={cartStyles.summaryLabel}>Items ({cartData.item_count})</Text>
                <Text style={cartStyles.summaryValue}>{formatPrice(cartData.total_amount)}</Text>
              </View>              
              <View style={cartStyles.summaryRow}>
                <Text style={cartStyles.summaryLabel}>Delivery</Text>
                <Text style={cartStyles.summaryValue}>Free</Text>
              </View>             
              <Divider style={cartStyles.divider} />             
              <View style={cartStyles.totalRow}>
                <Text style={cartStyles.totalLabel}>Total</Text>
                <Text style={cartStyles.totalValue}>{formatPrice(cartData.total_amount)}</Text>
              </View>
            </View>
            <View style={cartStyles.actionButtonsContainer}>
              <Button
                mode="outlined"
                onPress={handleClearCart}
                disabled={submitLoading}
                style={cartStyles.clearButton}
                buttonColor="#ffe6e6"
                textColor="#ff4444"
              >
                Clear Cart
              </Button>             
              <Button
                mode="contained"
                onPress={handlePlaceOrder}
                disabled={submitLoading}
                loading={submitLoading}
                style={cartStyles.orderButton}
                buttonColor="#4CAF50"
              >
                Place Order
              </Button>
            </View>
          </>
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
      {cartData.cart_items.length > 0 && (
        <FAB
          style={cartStyles.fab}
          icon="plus"
          label="Add More"
          onPress={() => navigation.navigate('Home')}
          disabled={submitLoading}
          color="#fff"
          backgroundColor="#4CAF50"
        />
      )}

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Remove Item</Dialog.Title>
          <Dialog.Content>
            {itemToDelete && (
              <Text>
                Are you sure you want to remove "{itemToDelete.product_name}" from your cart?
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setDeleteDialogVisible(false);
                setItemToDelete(null);
              }}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button 
              onPress={confirmDeleteItem}
              loading={submitLoading}
              disabled={submitLoading}
              textColor={theme.colors.error}
            >
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog visible={clearCartDialogVisible} onDismiss={() => setClearCartDialogVisible(false)}>
          <Dialog.Title>Clear Cart</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to clear all items from your cart?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setClearCartDialogVisible(false)}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button 
              onPress={confirmClearCart}
              loading={submitLoading}
              disabled={submitLoading}
              textColor={theme.colors.error}
            >
              Clear All
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog visible={orderDialogVisible} onDismiss={() => setOrderDialogVisible(false)}>
          <Dialog.Title>Place Order</Dialog.Title>
          <Dialog.Content>
            <Text style={cartStyles.dialogTitle}>Select Delivery Address:</Text>        
            {addresses.length === 0 ? (
              <View style={cartStyles.noAddressContainer}>
                <Text style={cartStyles.noAddressText}>No delivery addresses found</Text>
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    setOrderDialogVisible(false);
                    navigation.navigate('Location');
                  }}
                  style={cartStyles.addAddressButton}
                >
                  Add Address
                </Button>
              </View>
            ) : (
              <ScrollView style={cartStyles.addressList}>
                {addresses.map((address) => (
                  <Surface key={address.address_id} style={cartStyles.addressItem}>
                    <RadioButton.Group
                      onValueChange={(value) => setSelectedAddress(JSON.parse(value))}
                      value={selectedAddress ? JSON.stringify(selectedAddress) : ''}
                    >
                      <RadioButton.Item
                        label={formatAddress(address)}
                        value={JSON.stringify(address)}
                        style={cartStyles.radioItem}
                      />
                    </RadioButton.Group>
                    {address.is_default && (
                      <Chip style={cartStyles.defaultChip} compact>Default</Chip>
                    )}
                  </Surface>
                ))}
              </ScrollView>
            )}

            <Divider style={cartStyles.dialogDivider} />
            
            <View style={cartStyles.orderSummaryInDialog}>
              <Text style={cartStyles.orderSummaryTitle}>Order Summary:</Text>
              <Text style={cartStyles.orderSummaryText}>
                Items: {cartData.item_count} | Total: {formatPrice(cartData.total_amount)}
              </Text>
              <Text style={cartStyles.paymentMethod}>Payment: Cash on Delivery</Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setOrderDialogVisible(false);
                setSelectedAddress(null);
              }}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button 
              onPress={confirmPlaceOrder}
              loading={submitLoading}
              disabled={submitLoading || !selectedAddress}
              mode="contained"
            >
              Confirm Order
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>     
    </SafeAreaView>
  );
};

const cartStyles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    margin: 0,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    margin: 0,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  shoppingCartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  itemBadge: {
    backgroundColor: '#4CAF50',
  },
  emptyCartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 8,
  },
  emptyCartSubText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  continueShoppingButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
  },
  cartItemsContainer: {
    marginBottom: 20,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  productDetails: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 2,
  },
  stockInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  quantityButton: {
    margin: 0,
    width: 32,
    height: 32,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 12,
    minWidth: 30,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  deleteButton: {
    margin: 0,
    width: 40,
    height: 40,
  },
  summaryContainer: {
    backgroundColor: '#f8f4ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 8,
    backgroundColor: '#ddd',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  clearButton: {
    flex: 1,
    borderColor: '#ff4444',
    borderRadius: 25,
  },
  orderButton: {
    flex: 2,
    borderRadius: 25,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  noAddressContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAddressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  addAddressButton: {
    marginTop: 8,
  },
  addressList: {
    maxHeight: 200,
  },
  addressItem: {
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
  },
  radioItem: {
    paddingHorizontal: 8,
  },
  defaultChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
  },
  dialogDivider: {
    marginVertical: 16,
  },
  orderSummaryInDialog: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  orderSummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  orderSummaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export default CartScreen;