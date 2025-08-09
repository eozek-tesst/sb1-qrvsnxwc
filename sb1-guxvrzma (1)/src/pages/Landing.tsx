import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  CheckCircle, 
  X, 
  Users, 
  Package, 
  ClipboardList, 
  BarChart3, 
  Smartphone, 
  Shield,
  Star,
  Clock,
  CreditCard,
  Zap,
  AlertTriangle
} from 'lucide-react';

export function Landing() {
  const testimonials = [
    {
      name: "Maria Santos",
      business: "Doces da Maria",
      text: "Desde que comecei a usar o sistema, nunca mais perdi um pedido! Meu faturamento aumentou 40% em 3 meses."
    },
    {
      name: "Ana Paula",
      business: "Bolos da Ana",
      text: "Agora tenho controle total dos meus pedidos. Meus clientes ficam impressionados com minha organização!"
    },
    {
      name: "Carla Oliveira",
      business: "Confeitaria Carla",
      text: "O sistema me economiza 2 horas por dia! Posso focar no que realmente importa: fazer doces incríveis."
    }
  ];

  const features = [
    {
      icon: Package,
      title: "Gestão de Produtos",
      description: "Cadastre todos os seus produtos com preços e controle seu catálogo"
    },
    {
      icon: Users,
      title: "Controle de Clientes",
      description: "Mantenha todos os dados dos seus clientes organizados e acessíveis"
    },
    {
      icon: ClipboardList,
      title: "Organização de Pedidos",
      description: "Nunca mais perca um pedido com nosso sistema de controle completo"
    },
    {
      icon: BarChart3,
      title: "Relatórios Financeiros",
      description: "Acompanhe suas vendas e lucros com relatórios detalhados"
    },
    {
      icon: Smartphone,
      title: "Acesso Mobile",
      description: "Use em qualquer dispositivo, a qualquer hora e lugar"
    },
    {
      icon: Shield,
      title: "Dados Seguros",
      description: "Seus dados protegidos com a mais alta segurança"
    }
  ];

  const problems = [
    "Perder pedidos importantes?",
    "Trabalhar no caos total?",
    "Deixar dinheiro na mesa?",
    "Parecer amadora?"
  ];

  const benefits = [
    "Nunca mais perca um pedido",
    "Controle total do seu negócio",
    "Aumente suas vendas organizando melhor",
    "Economize tempo com automação",
    "Impressione seus clientes com profissionalismo",
    "Acesse de qualquer lugar, qualquer hora"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <ShoppingBag className="h-16 w-16 text-amber-600" />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transforme sua confeitaria em um
              <span className="text-amber-600 block">negócio organizado e lucrativo</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-4">
              Mais de <span className="font-bold text-amber-600">500 confeiteiras</span> já transformaram seus negócios
            </p>
            
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Pare de perder pedidos, esquecer entregas e trabalhar no caos...
            </p>
            
            <Link
              to="/pricing"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg mb-6"
            >
              Começar Minha Transformação
            </Link>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-amber-600 mr-1" />
                Ativação imediata
              </div>
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-amber-600 mr-1" />
                Cancele quando quiser
              </div>
            </div>
          </div>
          
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <img 
                src="https://images.pexels.com/photos/4109743/pexels-photo-4109743.jpeg?auto=compress&cs=tinysrgb&w=1200" 
                alt="Dashboard do sistema" 
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            Você está cansada de...
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {problems.map((problem, index) => (
              <div key={index} className="flex items-center justify-center bg-white p-6 rounded-lg shadow-md">
                <X className="h-8 w-8 text-red-500 mr-4 flex-shrink-0" />
                <span className="text-lg text-gray-700">{problem}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            Imagine ter controle total do seu negócio...
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center bg-green-50 p-4 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-500 mr-4 flex-shrink-0" />
                <span className="text-lg text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
                  <Icon className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Veja o que nossas clientes estão dizendo
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-amber-600">{testimonial.business}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Transforme sua confeitaria hoje mesmo
          </h2>
          
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 mb-8">
            <div className="text-6xl font-bold text-amber-600 mb-4">
              R$ 19,90<span className="text-2xl text-gray-600">/mês</span>
            </div>
            <p className="text-xl text-gray-600 mb-8">
              Menos de <span className="font-bold">R$ 0,66 por dia!</span>
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                "Sistema completo",
                "Acesso ilimitado", 
                "Suporte incluso",
                "Cancelamento livre",
                "Dados seguros"
              ].map((item, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            
            <Link
              to="/pricing"
              className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Quero Transformar Minha Confeitaria
            </Link>
          </div>
        </div>
      </section>

      {/* Urgency Section */}
      <section className="py-20 bg-red-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <AlertTriangle className="h-16 w-16 text-red-500" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Não deixe para depois!
          </h2>
          
          <p className="text-xl text-gray-700 mb-8">
            Cada dia que você adia é dinheiro perdido...
          </p>
          
          <div className="bg-white p-8 rounded-lg shadow-md mb-8">
            <p className="text-lg text-gray-700 mb-6">
              <strong>Pense assim:</strong> se você conseguir só <span className="text-amber-600 font-bold">2 pedidos a mais por mês</span>, 
              o sistema já se paga sozinho!
            </p>
          </div>
          
          <Link
            to="/pricing"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Sim, Quero Começar Agora!
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <ShoppingBag className="h-8 w-8 text-amber-600" />
          </div>
          
          <h3 className="text-xl font-bold mb-2">Gestão Confeitaria</h3>
          <p className="text-gray-400 mb-6">
            Transformando confeitarias em negócios organizados e lucrativos.
          </p>
          
          <div className="border-t border-gray-800 pt-6">
            <p className="text-gray-400">
              © 2025 Gestão Confeitaria — Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}