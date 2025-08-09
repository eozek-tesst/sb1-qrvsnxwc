import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Users, Phone, Calendar, ShoppingBag, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const customerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  name: string;
  phone: string;
  created_at: string;
  orders: Array<{
    id: string;
    total: number;
    status: string;
    delivery_date: string;
    created_at: string;
  }>;
}

export function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [user]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          orders(id, total, status, delivery_date, created_at)
        `)
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar clientes');
      console.error(error);
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: data.name,
            phone: data.phone,
          })
          .eq('id', editingCustomer.id);

        if (error) throw error;
        toast.success('Cliente atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('customers').insert([
          {
            user_id: user!.id,
            name: data.name,
            phone: data.phone,
          },
        ]);

        if (error) throw error;
        toast.success('Cliente criado com sucesso!');
      }

      setShowForm(false);
      setEditingCustomer(null);
      reset();
      await loadCustomers();
    } catch (error: any) {
      toast.error('Erro ao salvar cliente');
      console.error(error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setValue('name', customer.name);
    setValue('phone', customer.phone);
    setShowForm(true);
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
      toast.success('Cliente excluído com sucesso!');
      await loadCustomers();
    } catch (error: any) {
      toast.error('Erro ao excluir cliente');
      console.error(error);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    reset();
  };

  const getCustomerStats = (customer: Customer) => {
    const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
    const activeOrders = customer.orders.filter(order => order.status !== 'entregue').length;
    return { totalSpent, activeOrders, totalOrders: customer.orders.length };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome
                  </label>
                  <input
                    {...register('name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Nome completo"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    {...register('phone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="(00) 00000-0000"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Salvando...' : editingCustomer ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h2>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Phone className="h-4 w-4 mr-1" />
                    {selectedCustomer.phone}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">
                    {getCustomerStats(selectedCustomer).totalOrders}
                  </p>
                  <p className="text-sm text-gray-600">Total de Pedidos</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {getCustomerStats(selectedCustomer).totalSpent.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </p>
                  <p className="text-sm text-gray-600">Total Gasto</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {getCustomerStats(selectedCustomer).activeOrders}
                  </p>
                  <p className="text-sm text-gray-600">Pedidos Ativos</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Pedidos</h3>
              {selectedCustomer.orders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum pedido encontrado</p>
              ) : (
                <div className="space-y-3">
                  {selectedCustomer.orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              order.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'preparando' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'pronto' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mt-2">
                            <Calendar className="h-4 w-4 mr-1" />
                            Entrega: {format(parseISO(order.delivery_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Criado: {format(parseISO(order.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            {order.total.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customers List */}
      {customers.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum cliente cadastrado</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-amber-600 hover:text-amber-700 font-medium"
          >
            Cadastrar primeiro cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => {
            const stats = getCustomerStats(customer);
            return (
              <div
                key={customer.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Phone className="h-4 w-4 mr-1" />
                      {customer.phone}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="p-1 text-amber-600 hover:text-amber-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-amber-50 rounded-md">
                    <p className="text-xl font-bold text-amber-600">{stats.totalOrders}</p>
                    <p className="text-xs text-gray-600">Pedidos</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-md">
                    <p className="text-xl font-bold text-green-600">
                      {stats.totalSpent.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {format(parseISO(customer.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(customer)}
                    className="flex items-center text-sm text-amber-600 hover:text-amber-700 font-medium"
                  >
                    <ShoppingBag className="h-4 w-4 mr-1" />
                    Ver Pedidos
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}