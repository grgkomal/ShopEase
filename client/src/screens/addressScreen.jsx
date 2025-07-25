// src/screens/DeliveryAddressScreen.jsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
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
  Checkbox,
  FAB,
  List,
  IconButton,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAddresses, addAddress, updateAddress, deleteAddress } from '../services/address';
import { getCache } from '../utils/auth';
import { styles } from '../theme/styles';
import { theme } from '../theme/theme';

const DeliveryAddressScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    building: '',
    area: '',
    pincode: '',
    phone: '',
    is_default: false,
  });

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      console.log('Fetching delivery addresses...');
      
      const cachedData = await getCache();
      if (!cachedData || !cachedData.token) {
        console.log('No cached token found, redirecting to login');
        navigation.replace('Login');
        return;
      }

      const result = await getAddresses();
      console.log('Addresses fetch result:', result);

      if (result && (result.success || result.status === 'success') && result.data) {
        console.log('Addresses fetched successfully:', result.data);
        setAddresses(Array.isArray(result.data) ? result.data : []);
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to fetch addresses';
        console.error('Fetch addresses failed:', errorMessage);
        showSnackbar(errorMessage);
        setAddresses([]);
      }
      
    } catch (error) {
      console.error('Error fetching addresses:', error);
      showSnackbar('Failed to load addresses. Please try again.');
      setAddresses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const showSnackbar = (message) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.building.trim()) {
      newErrors.building = 'Building/House number is required';
    }

    if (!formData.area.trim()) {
      newErrors.area = 'Area/Street is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      building: '',
      area: '',
      pincode: '',
      phone: '',
      is_default: false,
    });
    setErrors({});
    setEditingAddress(null);
  };

  const handleAddAddress = () => {
    resetForm();
    setDialogVisible(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setFormData({
      building: address.building || '',
      area: address.area || '',
      pincode: address.pincode || '',
      phone: address.phone || '',
      is_default: Boolean(address.is_default),
    });
    setErrors({});
    setDialogVisible(true);
  };

  const handleSaveAddress = async () => {
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);
      console.log('Saving address...');

      const addressData = {
        building: formData.building.trim(),
        area: formData.area.trim(),
        pincode: formData.pincode.trim(),
        phone: formData.phone.trim(),
        is_default: formData.is_default ? 1 : 0,
      };

      console.log('Address data to save:', addressData);

      let result;
      if (editingAddress) {
        
        console.log('Updating address with ID:', editingAddress.address_id);
        result = await updateAddress(editingAddress.address_id, addressData);
      } else {
        
        console.log('Adding new address');
        result = await addAddress(addressData);
      }

      console.log('Save result:', result);

      if (result && (result.success || result.status === 'success')) {
        showSnackbar(editingAddress ? 'Address updated successfully' : 'Address added successfully');
        setDialogVisible(false);
        resetForm();
        fetchAddresses();  
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to save address';
        console.error('Save address failed:', errorMessage);
        showSnackbar(errorMessage);
      }
      
    } catch (error) {
      console.error('Save address error:', error);
      showSnackbar('Failed to save address. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteAddress = (address) => {
    setAddressToDelete(address);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return;

    try {
      setSubmitLoading(true);
      console.log('Deleting address with ID:', addressToDelete.address_id);

      const result = await deleteAddress(addressToDelete.address_id);
      console.log('Delete result:', result);

      if (result && (result.success || result.status === 'success')) {
        showSnackbar('Address deleted successfully');
        setDeleteDialogVisible(false);
        setAddressToDelete(null);
        fetchAddresses();  
      } else {
        const errorMessage = result?.message || result?.error || 'Failed to delete address';
        console.error('Delete address failed:', errorMessage);
        showSnackbar(errorMessage);
      }
      
    } catch (error) {
      console.error('Delete address error:', error);
      showSnackbar('Failed to delete address. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRefresh = () => {
    console.log('Refreshing addresses...');
    setRefreshing(true);
    fetchAddresses();
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const closeDialog = () => {
    setDialogVisible(false);
    resetForm();
  };

  const formatAddress = (address) => {
    return `${address.building}, ${address.area}, ${address.pincode}`;
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.text }}>Loading addresses...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
      
        <View style={styles.headerContainer}>
          <Title style={styles.headerTitle}>Delivery Addresses</Title>
          <Button
            mode="text"
            onPress={handleRefresh}
            loading={refreshing}
            disabled={submitLoading}
            style={styles.refreshButton}
          >
            Refresh
          </Button>
        </View>

        {addresses.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text style={styles.noDataText}>No delivery addresses found</Text>
              <Text style={styles.noDataSubText}>Add your first delivery address to get started</Text>
            </Card.Content>
          </Card>
        ) : (
          addresses.map((address, index) => (
            <Card key={address.address_id || index} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.addressHeader}>
                  <View style={styles.addressInfo}>
                    {address.is_default ? (
                      <Text style={styles.defaultBadge}>DEFAULT</Text>
                    ) : null}
                    <Text style={styles.addressText}>{formatAddress(address)}</Text>
                    <Text style={styles.phoneText}>Phone: {address.phone}</Text>
                    {address.created_at && (
                      <Text style={styles.dateText}>
                        Added: {new Date(address.created_at).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.addressActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => handleEditAddress(address)}
                      disabled={submitLoading}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor={theme.colors.error}
                      onPress={() => handleDeleteAddress(address)}
                      disabled={submitLoading}
                    />
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddAddress}
        disabled={submitLoading}
      />

      <Portal>
        <Dialog 
          visible={dialogVisible} 
          onDismiss={closeDialog}
          style={styles.dialog}
        >
          <Dialog.Title>
            {editingAddress ? 'Edit Address' : 'Add New Address'}
          </Dialog.Title>
          <Dialog.Content>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                label="Building/House Number"
                value={formData.building}
                onChangeText={(value) => updateFormData('building', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="home" />}
                error={!!errors.building}
                placeholder="e.g., 123, ABC Apartments"
              />
              <HelperText type="error" visible={!!errors.building}>
                {errors.building}
              </HelperText>

              <TextInput
                label="Area/Street"
                value={formData.area}
                onChangeText={(value) => updateFormData('area', value)}
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="map-marker" />}
                error={!!errors.area}
                placeholder="e.g., MG Road, Sector 21"
              />
              <HelperText type="error" visible={!!errors.area}>
                {errors.area}
              </HelperText>

              <TextInput
                label="Pincode"
                value={formData.pincode}
                onChangeText={(value) => updateFormData('pincode', value)}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="map" />}
                error={!!errors.pincode}
                placeholder="e.g., 411001"
                maxLength={6}
              />
              <HelperText type="error" visible={!!errors.pincode}>
                {errors.pincode}
              </HelperText>

              <TextInput
                label="Phone Number"
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.input}
                left={<TextInput.Icon icon="phone" />}
                error={!!errors.phone}
                placeholder="e.g., 9876543210"
                maxLength={10}
              />
              <HelperText type="error" visible={!!errors.phone}>
                {errors.phone}
              </HelperText>

              <View style={styles.checkboxContainer}>
                <Checkbox
                  status={formData.is_default ? 'checked' : 'unchecked'}
                  onPress={() => updateFormData('is_default', !formData.is_default)}
                />
                <Text style={styles.checkboxLabel}>Set as default address</Text>
              </View>
              <HelperText type="info" visible={formData.is_default}>
                This will be your primary delivery address
              </HelperText>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={closeDialog}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleSaveAddress} 
              loading={submitLoading}
              disabled={submitLoading}
              mode="contained"
            >
              {editingAddress ? 'Update' : 'Add'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <Portal>
        <Dialog 
          visible={deleteDialogVisible} 
          onDismiss={() => {
            setDeleteDialogVisible(false);
            setAddressToDelete(null);
          }}
        >
          <Dialog.Title>Delete Address</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this address?</Text>
            {addressToDelete && (
              <Text style={styles.deleteAddressText}>
                {formatAddress(addressToDelete)}
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => {
                setDeleteDialogVisible(false);
                setAddressToDelete(null);
              }}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button 
              onPress={confirmDeleteAddress} 
              loading={submitLoading}
              disabled={submitLoading}
              mode="contained"
              buttonColor={theme.colors.error}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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

const addressStyles = StyleSheet.create({
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addressInfo: {
    flex: 1,
    marginRight: 10,
  },
  addressActions: {
    flexDirection: 'row',
  },
  defaultBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.outline,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.text,
  },
  deleteAddressText: {
    marginTop: 8,
    padding: 8,
    backgroundColor: theme.colors.errorContainer,
    borderRadius: 4,
    fontSize: 14,
    color: theme.colors.onErrorContainer,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  dialog: {
    maxHeight: '80%',
  },
});

// const mergedStyles = { ...styles, ...addressStyles };

export default DeliveryAddressScreen;