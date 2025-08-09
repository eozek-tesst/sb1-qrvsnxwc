import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { CheckCircle, ArrowRight, Crown } from 'lucide-react';

export function Success() {
  const { refetch, getProductName, isActive } = useSubscription();

  useEffect(() => {
    // Refetch subscription data after successful payment
    const timer = setTimeout(() => {
      refetch();
    }, 2000);

    return () => clearTimeout(timer);
  }, [refetch]);

  const productName = getProductName();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Pagamento Confirmado!
          </h1>

          <p className="text-gray-600 mb-6">
            Sua assinatura foi ativada com sucesso. Bem-vinda ao futuro da sua confeitaria!
          </p>

          {isActive() && productName && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center mb-2">
                <Crown className="h-5 w-5 text-amber-600 mr-2" />
                <span className="font-semibold text-amber-800">Plano Ativo</span>
              </div>
              <p className="text-amber-700">{productName}</p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <div className="flex items-center text-left">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Acesso completo liberado</span>
            </div>
            <div className="flex items-center text-left">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Dados sincronizados</span>
            </div>
            <div className="flex items-center text-left">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Pronta para usar</span>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center justify-center w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Começar a Usar
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>

          <p className="text-sm text-gray-500 mt-6">
            Você receberá um email de confirmação em breve
          </p>
        </div>
      </div>
    </div>
  );
}