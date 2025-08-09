import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { Crown, AlertCircle, CheckCircle } from 'lucide-react';

export function SubscriptionStatus() {
  const { subscription, loading, isActive, isPending, isCanceled, getProductName } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
        <span>Carregando...</span>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <AlertCircle className="h-4 w-4 text-gray-400" />
        <span>Sem assinatura</span>
      </div>
    );
  }

  const productName = getProductName();

  if (isActive()) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>{productName || 'Assinatura Ativa'}</span>
      </div>
    );
  }

  if (isPending()) {
    return (
      <div className="flex items-center space-x-2 text-sm text-amber-600">
        <Crown className="h-4 w-4" />
        <span>Assinatura Pendente</span>
      </div>
    );
  }

  if (isCanceled()) {
    return (
      <div className="flex items-center space-x-2 text-sm text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span>Assinatura Cancelada</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <AlertCircle className="h-4 w-4 text-gray-400" />
      <span>Status Desconhecido</span>
    </div>
  );
}