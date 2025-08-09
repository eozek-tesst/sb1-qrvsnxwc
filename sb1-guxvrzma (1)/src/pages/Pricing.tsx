import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { stripeProducts } from '../stripe-config';
import { CheckCircle, Crown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function Pricing() {
  const { user } = useAuth();
  const { subscription, isActive } = useSubscription();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(priceId);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          mode: 'subscription',
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de checkout');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-gray-600">
            Transforme sua confeitaria em um negócio organizado e lucrativo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-8 max-w-md mx-auto">
          {stripeProducts.map((product) => {
            const isCurrentPlan = subscription?.price_id === product.priceId && isActive();
            const isLoadingThis = loading === product.priceId;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl shadow-xl p-8 relative ${
                  product.mode === 'subscription' ? 'border-2 border-amber-500' : ''
                }`}
              >
                {product.mode === 'subscription' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-amber-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Mais Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {product.description}
                  </p>
                  
                  <div className="text-5xl font-bold text-amber-600 mb-2">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                    {product.mode === 'subscription' && (
                      <span className="text-lg text-gray-600">/mês</span>
                    )}
                  </div>
                  
                  {product.mode === 'subscription' && (
                    <p className="text-sm text-gray-500">
                      Menos de R$ {(product.price / 30).toFixed(2).replace('.', ',')} por dia!
                    </p>
                  )}
                </div>

                <div className="space-y-4 mb-8">
                  {[
                    'Gestão completa de pedidos',
                    'Controle de produtos e preços',
                    'Cadastro de clientes',
                    'Relatórios financeiros',
                    'Acesso mobile',
                    'Suporte incluso',
                    'Dados seguros na nuvem',
                    'Atualizações automáticas'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  {isCurrentPlan ? (
                    <div className="flex items-center justify-center py-3 px-6 bg-green-100 text-green-800 rounded-lg font-medium">
                      <Crown className="h-5 w-5 mr-2" />
                      Plano Atual
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(product.priceId)}
                      disabled={isLoadingThis}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoadingThis ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processando...
                        </div>
                      ) : (
                        `Assinar ${product.name}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-600">
            Cancele a qualquer momento • Suporte 24/7 • Dados seguros
          </p>
        </div>
      </div>
    </div>
  );
}