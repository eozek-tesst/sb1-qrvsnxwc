import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, startOfMonth, endOfMonth, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Calendar, DollarSign, ShoppingCart, Phone, Clock, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const orderSchema = z.object({
  customerId: z.string().min(1, 'Selecione um cliente'),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
  })).min(1, 'Adicione pelo menos um produto'),
  deliveryDate: z.string().min(1, 'Selecione a data de entrega'),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Order {
  id: string;
  customer: Customer;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  delivery_date: string;
  status: 'pendente' | 'preparando' | 'pronto' | 'entregue';
  notes: string;
  total: number;
  created_at: string;
}

const statusConfig = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', next: 'preparando' },
  preparando: { label: 'Preparando', color: 'bg-blue-100 text-blue-800', next: 'pronto' },
  pronto: { label: 'Pronto', color: 'bg-green-100 text-green-800', next: 'entregue' },
  entregue: { label: 'Entregue', color: 'bg-gray-100 text-gray-800', next: null },
};

export function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
  });

  const selectedCustomerId = watch('customerId');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    calculateStats();
  }, [orders]);

  const loadData = async () => {
    try {
      const [ordersResult, customersResult, productsResult] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            *,
            customer:customers(*)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (customersResult.error) throw customersResult.error;
      if (productsResult.error) throw productsResult.error;

      setOrders(ordersResult.data || []);
      setCustomers(customersResult.data || []);
      setProducts(productsResult.data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados');
      console.error(error);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthlyOrders = orders.filter(order => {
      const orderDate = parseISO(order.created_at);
      return isAfter(orderDate, monthStart) && isBefore(orderDate, monthEnd);
    });

    const total = monthlyOrders.reduce((sum, order) => sum + order.total, 0);
    setMonthlyTotal(total);

    const active = orders.filter(order => order.status !== 'entregue').length;
    setActiveOrders(active);
  };

  const addItem = () => {
    setSelectedItems([...selectedItems, { productId: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof typeof selectedItems[0], value: any) => {
    const updated = [...selectedItems];
    updated[index] = { ...updated[index], [field]: value };
    setSelectedItems(updated);
    updateFormItems(updated);
  };

  const updateFormItems = (items: Array<{ productId: string; quantity: number }>) => {
    const formItems = items
      .filter(item => item.productId)
      .map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          name: product?.name || '',
          quantity: item.quantity,
          price: product?.price || 0,
        };
      });
    setValue('items', formItems);
  };

  const onSubmit = async (data: OrderFormData) => {
    try {
      let customerId = data.customerId;

      // If "new_customer" is selected, create a new customer
      if (customerId === 'new_customer') {
        if (!data.customerName || !data.customerPhone) {
          toast.error('Informe nome e telefone do novo cliente');
          return;
        }

        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([{
            user_id: user!.id,
            name: data.customerName,
            phone: data.customerPhone,
          }])
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
        
        // Refresh customers list
        await loadData();
      }

      const total = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      const { error } = await supabase.from('orders').insert([{
        user_id: user!.id,
        customer_id: customerId,
        items: data.items,
        delivery_date: data.deliveryDate,
        notes: data.notes || '',
        total,
      }]);

      if (error) throw error;

      toast.success('Pedido criado com sucesso!');
      setShowOrderForm(false);
      setSelectedItems([]);
      setShowNewCustomer(false);
      reset();
      await loadData();
    } catch (error: any) {
      toast.error('Erro ao criar pedido');
      console.error(error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast.success('Status atualizado com sucesso!');
      await loadData();
    } catch (error: any) {
      toast.error('Erro ao atualizar status');
      console.error(error);
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total do Mês</p>
              <p className="text-2xl font-bold text-gray-900">
                {monthlyTotal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pedidos Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{activeOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-amber-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="all">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="preparando">Preparando</option>
              <option value="pronto">Pronto</option>
              <option value="entregue">Entregue</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => setShowOrderForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Pedido
        </button>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Novo Pedido</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <select
                    {...register('customerId')}
                    onChange={(e) => {
                      setValue('customerId', e.target.value);
                      setShowNewCustomer(e.target.value === 'new_customer');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                    <option value="new_customer">+ Novo Cliente</option>
                  </select>
                  {errors.customerId && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerId.message}</p>
                  )}
                </div>

                {/* New Customer Fields */}
                {showNewCustomer && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-amber-50 rounded-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Cliente
                      </label>
                      <input
                        {...register('customerName')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone
                      </label>
                      <input
                        {...register('customerPhone')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                )}

                {/* Products */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Produtos
                    </label>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-sm text-amber-600 hover:text-amber-700"
                    >
                      + Adicionar Item
                    </button>
                  </div>
                  
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                      >
                        <option value="">Selecione um produto</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} - {product.price.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        placeholder="Qtd"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="px-2 py-2 text-red-600 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {errors.items && (
                    <p className="mt-1 text-sm text-red-600">{errors.items.message}</p>
                  )}
                </div>

                {/* Delivery Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Entrega
                  </label>
                  <input
                    type="date"
                    {...register('deliveryDate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                  {errors.deliveryDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.deliveryDate.message}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Observações sobre o pedido..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowOrderForm(false);
                      setSelectedItems([]);
                      setShowNewCustomer(false);
                      reset();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Criando...' : 'Criar Pedido'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum pedido encontrado</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {order.customer.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Phone className="h-4 w-4 mr-1" />
                    {order.customer.phone}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}>
                    {statusConfig[order.status].label}
                  </span>
                  <div className="text-lg font-bold text-gray-900 mt-1">
                    {order.total.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Itens:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.quantity}x {item.name} - {(item.price * item.quantity).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="h-4 w-4 mr-1" />
                    Entrega: {format(parseISO(order.delivery_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    Criado: {format(parseISO(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </div>
                  {order.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <strong>Obs:</strong> {order.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {statusConfig[order.status].next && (
                <div className="flex justify-end">
                  <button
                    onClick={() => updateOrderStatus(order.id, statusConfig[order.status].next!)}
                    className="px-3 py-1 text-sm font-medium text-amber-600 border border-amber-600 rounded-md hover:bg-amber-50 transition-colors"
                  >
                    Marcar como {statusConfig[statusConfig[order.status].next!].label}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}