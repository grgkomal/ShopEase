
// src/screens/CartScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image, RefreshControl, Dimensions } from 'react-native';
import {
  Text,
  Button,
  Snackbar,
  Dialog,
  Portal,
  ActivityIndicator,
  FAB,
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
  clearCartWithApi
} from '../services/cart';
import { getAddresses } from '../services/address';
import { getCache } from '../utils/auth';
import { config } from '../configuration/config';
import { theme } from '../theme/theme';
import BottomNavigation from '../navigation/BottomNavigation';

const { width } = Dimensions.get('window');

const CartScreen = ({ navigation }) => {
  const [cartData, setCartData] = useState({
    cart_items: [],
    total_amount: 0,
    item_count: 0
  });

  // Helper function to get product image URL
  const getProductImageUrl = (product) => {
    try {
      if (!config || !config.server) {
        console.warn('Config or server URL not available');
        return null;
      }

      if (product?.image_url) {
        if (product.image_url.startsWith('http')) {
          return product.image_url;
        }
        const filename = product.image_url.includes('/')
          ? product.image_url.split('/').pop()
          : product.image_url;

        const imageUrl = `${config.server}/product/download/${filename}`;
        console.log('Constructed product image URL:', imageUrl);
        return imageUrl;
      }

      return null;
    } catch (error) {
      console.error('Error constructing product image URL:', error);
      return null;
    }
  };

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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color={theme?.colors?.primary || '#4CAF50'} />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor="#fff"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Cart</Text>
        </View>
        <Button
          mode="text"
          onPress={handleRefresh}
          loading={refreshing}
          disabled={submitLoading}
          textColor="#fff"
          style={styles.refreshButton}
        >
          Refresh
        </Button>
      </View>

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme?.colors?.primary || '#4CAF50']}
          />
        }
      >
        <View style={styles.titleContainer}>
          <Text style={styles.pageTitle}>Shopping Cart</Text>
          {cartData.item_count > 0 && (
            <Badge size={20} style={styles.itemBadge}>
              {cartData.item_count}
            </Badge>
          )}
        </View>

        {cartData.cart_items.length === 0 ? (
          <View style={styles.emptyCartContainer}>
            <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
            <Text style={styles.emptyCartSubtitle}>Add some products to get started</Text>
            <Button 
              mode="contained" 
              onPress={() => navigation.navigate('Home')}
              style={styles.continueShoppingButton}
            >
              Continue Shopping
            </Button>
          </View>
        ) : (
          <>
            <View style={styles.cartItemsContainer}>
              {cartData.cart_items.map((item, index) => {
                const imageUrl = getProductImageUrl(item);
                
                return (
                  <View key={item.cart_id || index} style={styles.cartItem}>

                    <View style={styles.productImageContainer}>
                      {imageUrl ? (
                        <Image 
                          source={{ uri: imageUrl }} 
                          style={styles.productImage}
                          resizeMode="cover"
                          onError={(error) => {
                            console.log('Image load error for product:', item.product_name, error.nativeEvent.error);
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully for:', item.product_name);
                          }}
                        />
                      ) : (
                        <View style={styles.placeholderImage}>
                          <Text style={styles.placeholderText}>No Image</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.productDetails}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {item.product_name}
                      </Text>
                      <Text style={styles.productPrice}>
                        {formatPrice(item.price)} each
                      </Text>
                      <Text style={styles.stockInfo}>
                        Available: {item.available_quantity}
                      </Text>

                      <View style={styles.quantityRow}>
                        <View style={styles.quantityControls}>
                          <IconButton
                            icon="minus"
                            size={16}
                            onPress={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={submitLoading || item.quantity <= 1}
                            style={styles.quantityButton}
                            iconColor="#666"
                          />
                          <Text style={styles.quantityText}>{item.quantity}</Text>
                          <IconButton
                            icon="plus"
                            size={16}
                            onPress={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={submitLoading || item.quantity >= item.available_quantity}
                            style={styles.quantityButton}
                            iconColor="#666"
                          />
                        </View>
                        <Text style={styles.itemTotal}>
                          Total: {formatPrice(item.item_total)}
                        </Text>
                      </View>
                    </View>

                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#ff4444"
                      onPress={() => handleDeleteItem(item)}
                      disabled={submitLoading}
                      style={styles.deleteButton}
                    />
                  </View>
                );
              })}
            </View>

            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <Divider style={styles.divider} />
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Items ({cartData.item_count})
                </Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(cartData.total_amount)}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery</Text>
                <Text style={styles.summaryValue}>Free</Text>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  {formatPrice(cartData.total_amount)}
                </Text>
              </View>
            </View>

            <View style={styles.actionButtonsContainer}>
              <Button
                mode="outlined"
                onPress={handleClearCart}
                disabled={submitLoading}
                style={styles.clearButton}
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
                style={styles.orderButton}
                buttonColor="#4CAF50"
              >
                Place Order
              </Button>
            </View>
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {cartData.cart_items.length > 0 && (
        <FAB
          style={styles.fab}
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
              textColor={theme?.colors?.error || '#f44336'}
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
              textColor={theme?.colors?.error || '#f44336'}
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
            <Text style={styles.dialogSectionTitle}>Select Delivery Address:</Text>
            
            {addresses.length === 0 ? (
              <View style={styles.noAddressContainer}>
                <Text style={styles.noAddressText}>No delivery addresses found</Text>
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    setOrderDialogVisible(false);
                    navigation.navigate('Location');
                  }}
                  style={styles.addAddressButton}
                >
                  Add Address
                </Button>
              </View>
            ) : (
              <ScrollView style={styles.addressList}>
                {addresses.map((address) => (
                  <Surface key={address.address_id} style={styles.addressItem}>
                    <RadioButton.Group
                      onValueChange={(value) => setSelectedAddress(JSON.parse(value))}
                      value={selectedAddress ? JSON.stringify(selectedAddress) : ''}
                    >
                      <RadioButton.Item
                        label={formatAddress(address)}
                        value={JSON.stringify(address)}
                        style={styles.radioItem}
                      />
                    </RadioButton.Group>
                    {address.is_default && (
                      <Chip style={styles.defaultChip} compact>
                        Default
                      </Chip>
                    )}
                  </Surface>
                ))}
              </ScrollView>
            )}

            <Divider style={styles.dialogDivider} />
            
            <View style={styles.orderSummaryDialog}>
              <Text style={styles.orderSummaryTitle}>Order Summary:</Text>
              <Text style={styles.orderSummaryText}>
                Items: {cartData.item_count} | Total: {formatPrice(cartData.total_amount)}
              </Text>
              <Text style={styles.paymentMethodText}>Payment: Cash on Delivery</Text>
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
      <BottomNavigation navigation={navigation} activeRoute="Cart" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
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
    paddingBottom: 100,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pageTitle: {
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
    padding: 40,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginTop: 50,
  },
  emptyCartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 8,
  },
  emptyCartSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  continueShoppingButton: {
    marginTop: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    paddingHorizontal: 24,
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
    width: 70,
    height: 70,
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
    lineHeight: 20,
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
    marginTop: 4,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  divider: {
    marginVertical: 8,
    backgroundColor: '#e0e0e0',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
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
    borderWidth: 1,
  },
  orderButton: {
    flex: 2,
    borderRadius: 25,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
    borderRadius: 28,
    elevation: 8,
  },
  dialogSectionTitle: {
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
    textAlign: 'center',
  },
  addAddressButton: {
    marginTop: 8,
    borderRadius: 20,
  },
  addressList: {
    maxHeight: 200,
  },
  addressItem: {
    marginVertical: 4,
    borderRadius: 8,
    elevation: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  radioItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
  },
  dialogDivider: {
    marginVertical: 16,
    backgroundColor: '#e0e0e0',
  },
  orderSummaryDialog: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
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
    lineHeight: 18,
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    margin: 16,
  },
  bottomSpacing: {
    height: 80,
  },
});

export default CartScreen;