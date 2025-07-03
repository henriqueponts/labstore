import axios from 'axios';
import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
interface UsuarioData {
  id_cliente?: number;
  id_usuario?: number;
  nome?: string;
  email: string;
  tipo: 'cliente' | 'funcionario';
  tipo_perfil?: 'admin' | 'analista';
}

const Home: React.FC = () => {
  const [usuario, setUsuario] = useState<UsuarioData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Verificar se há usuário logado (opcional)
  const checkUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:3000/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 200) {
          setUsuario(response.data);
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Usuário não logado ou token inválido - não é problema
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        usuario={usuario}
        onLogout={handleLogout}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <h1 className="text-4xl font-bold text-gray-800">
          TESTE 1
        </h1>
      </div>
    </div>
  );
};

export default Home;


// import axios from 'axios';
// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Header from '../components/Header';

// interface UsuarioData {
//   id_cliente?: number;
//   id_usuario?: number;
//   nome?: string;
//   email: string;
//   tipo: 'cliente' | 'funcionario';
//   tipo_perfil?: 'admin' | 'analista';
// }

// interface Produto {
//   id_produto: number;
//   nome: string;
//   preco: number;
//   marca: string;
//   modelo: string;
//   imagemUrl?: string;
//   estoque: number;
// }

// const Home: React.FC = () => {
//   const [usuario, setUsuario] = useState<UsuarioData | null>(null);
//   const [produtos, setProdutos] = useState<Produto[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const navigate = useNavigate();

//   // Verificar se há usuário logado (opcional)
//   const checkUser = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (token) {
//         const response = await axios.get('http://localhost:3000/auth/me', {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (response.status === 200) {
//           setUsuario(response.data);
//         }
//       }
//     } catch (err) {
//       // Usuário não logado ou token inválido - não é problema
//       localStorage.removeItem('token');
//       localStorage.removeItem('usuario');
//     }
//   };

//   // Carregar produtos (simulação - você pode implementar a API real)
//   const loadProdutos = () => {
//     // Produtos de exemplo para demonstração
//     const produtosExemplo: Produto[] = [
//       {
//         id_produto: 1,
//         nome: "Notebook Gamer ROG",
//         preco: 4999.99,
//         marca: "ASUS",
//         modelo: "ROG Strix G15",
//         imagemUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
//         estoque: 5
//       },
//       {
//         id_produto: 2,
//         nome: "Monitor 4K Gaming",
//         preco: 1299.99,
//         marca: "Samsung",
//         modelo: "Odyssey G7",
//         imagemUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400",
//         estoque: 12
//       },
//       {
//         id_produto: 3,
//         nome: "Smartphone Galaxy",
//         preco: 2499.99,
//         marca: "Samsung",
//         modelo: "Galaxy S24",
//         imagemUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
//         estoque: 8
//       },
//       {
//         id_produto: 4,
//         nome: "Tablet iPad Pro",
//         preco: 3999.99,
//         marca: "Apple",
//         modelo: "iPad Pro 12.9",
//         imagemUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",
//         estoque: 3
//       },
//       {
//         id_produto: 5,
//         nome: "Processador Intel i9",
//         preco: 2199.99,
//         marca: "Intel",
//         modelo: "Core i9-13900K",
//         imagemUrl: "https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400",
//         estoque: 15
//       },
//       {
//         id_produto: 6,
//         nome: "SSD NVMe 1TB",
//         preco: 599.99,
//         marca: "Samsung",
//         modelo: "980 PRO",
//         imagemUrl: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400",
//         estoque: 25
//       },
//       {
//         id_produto: 7,
//         nome: "Placa de Vídeo RTX 4080",
//         preco: 6999.99,
//         marca: "NVIDIA",
//         modelo: "GeForce RTX 4080",
//         imagemUrl: "https://images.unsplash.com/photo-1591238371164-2d9b9cfb3bb4?w=400",
//         estoque: 7
//       },
//       {
//         id_produto: 8,
//         nome: "Headset Gamer Wireless",
//         preco: 899.99,
//         marca: "Logitech",
//         modelo: "G PRO X",
//         imagemUrl: "https://images.unsplash.com/photo-1599669454699-248893623440?w=400",
//         estoque: 18
//       }
//     ];
//     setProdutos(produtosExemplo);
//   };

//   useEffect(() => {
//     const initPage = async () => {
//       await checkUser();
//       loadProdutos();
//       setLoading(false);
//     };
//     initPage();
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('usuario');
//     setUsuario(null);
//     delete axios.defaults.headers.common['Authorization'];
//   };

//   const formatPrice = (price: number) => {
//     return new Intl.NumberFormat('pt-BR', {
//       style: 'currency',
//       currency: 'BRL'
//     }).format(price);
//   };

//   // Filtrar produtos baseado na busca
//   const filteredProdutos = produtos.filter(produto =>
//     produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     produto.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     produto.modelo.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-100">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
//           <p className="text-gray-600">Carregando loja...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Header 
//         usuario={usuario}
//         onLogout={handleLogout}
//         searchTerm={searchTerm}
//         onSearchChange={setSearchTerm}
//       />

//       {/* Hero Section */}
//       <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
//         <div className="max-w-7xl mx-auto px-4 text-center">
//           <h2 className="text-4xl md:text-6xl font-bold mb-4">
//             Tecnologia que Transforma
//           </h2>
//           <p className="text-xl mb-8 text-blue-100">
//             Encontre os melhores produtos tecnológicos com preços incríveis
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
//               Ver Ofertas
//             </button>
//             <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
//               Assistência Técnica
//             </button>
//           </div>
//         </div>
//       </section>

//       {/* Stats Section */}
//       <section className="py-12 bg-white">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
//             <div>
//               <div className="text-3xl font-bold text-blue-600">500+</div>
//               <div className="text-gray-600">Produtos</div>
//             </div>
//             <div>
//               <div className="text-3xl font-bold text-green-600">5000+</div>
//               <div className="text-gray-600">Clientes</div>
//             </div>
//             <div>
//               <div className="text-3xl font-bold text-purple-600">15</div>
//               <div className="text-gray-600">Anos de Experiência</div>
//             </div>
//             <div>
//               <div className="text-3xl font-bold text-orange-600">98%</div>
//               <div className="text-gray-600">Satisfação</div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Products Section */}
//       <section className="py-16">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="text-center mb-12">
//             <h3 className="text-3xl font-bold text-gray-800 mb-4">
//               {searchTerm ? `Resultados para "${searchTerm}"` : 'Produtos em Destaque'}
//             </h3>
//             <p className="text-gray-600">
//               {searchTerm 
//                 ? `${filteredProdutos.length} produto(s) encontrado(s)`
//                 : 'Confira nossa seleção especial de produtos tecnológicos'
//               }
//             </p>
//           </div>

//           {filteredProdutos.length === 0 ? (
//             <div className="text-center py-12">
//               <p className="text-gray-500 text-lg">
//                 {searchTerm 
//                   ? 'Nenhum produto encontrado para sua busca.'
//                   : 'Carregando produtos...'
//                 }
//               </p>
//               {searchTerm && (
//                 <button 
//                   onClick={() => setSearchTerm('')}
//                   className="mt-4 text-blue-600 hover:text-blue-800 underline"
//                 >
//                   Ver todos os produtos
//                 </button>
//               )}
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//               {filteredProdutos.map((produto) => (
//                 <div key={produto.id_produto} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
//                   <div className="relative aspect-w-16 aspect-h-9 overflow-hidden">
//                     <img
//                       src={produto.imagemUrl || 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'}
//                       alt={produto.nome}
//                       className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
//                     />
//                     {produto.estoque <= 5 && (
//                       <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
//                         Últimas unidades
//                       </div>
//                     )}
//                   </div>
//                   <div className="p-4">
//                     <div className="flex items-center text-sm text-gray-500 mb-2">
//                       <span>{produto.marca}</span>
//                       <span className="mx-2">•</span>
//                       <span>{produto.modelo}</span>
//                     </div>
//                     <h4 className="text-lg font-semibold text-gray-800 mb-3 line-clamp-2">
//                       {produto.nome}
//                     </h4>
//                     <div className="flex items-center justify-between mb-4">
//                       <span className="text-2xl font-bold text-blue-600">
//                         {formatPrice(produto.preco)}
//                       </span>
//                       <span className={`text-sm ${produto.estoque <= 5 ? 'text-red-500' : 'text-gray-500'}`}>
//                         {produto.estoque} em estoque
//                       </span>
//                     </div>
//                     <button 
//                       className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
//                       disabled={produto.estoque === 0}
//                     >
//                       {produto.estoque === 0 ? 'Indisponível' : 'Adicionar ao Carrinho'}
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </section>

//       {/* Services Section */}
//       <section className="py-16 bg-white">
//         <div className="max-w-7xl mx-auto px-4 text-center">
//           <h3 className="text-3xl font-bold text-gray-800 mb-12">Nossos Serviços</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             <div className="p-6">
//               <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                 </svg>
//               </div>
//               <h4 className="text-xl font-semibold mb-2">Garantia Estendida</h4>
//               <p className="text-gray-600">Proteção completa para seus equipamentos com nossa garantia estendida</p>
//             </div>
//             <div className="p-6">
//               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
//                 </svg>
//               </div>
//               <h4 className="text-xl font-semibold mb-2">Assistência Técnica</h4>
//               <p className="text-gray-600">Reparo especializado com técnicos qualificados e peças originais</p>
//             </div>
//             <div className="p-6">
//               <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
//                 <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
//                 </svg>
//               </div>
//               <h4 className="text-xl font-semibold mb-2">Entrega Rápida</h4>
//               <p className="text-gray-600">Receba seus produtos com segurança e agilidade em toda região</p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-800 text-white py-12">
//         <div className="max-w-7xl mx-auto px-4">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
//             <div>
//               <h5 className="text-lg font-semibold mb-4">LabStore</h5>
//               <p className="text-gray-400 text-sm mb-4">
//                 Sua loja de tecnologia com os melhores produtos e preços do mercado.
//               </p>
//               <div className="flex space-x-4">
//                 <a href="#" className="text-gray-400 hover:text-white">
//                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
//                     <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
//                   </svg>
//                 </a>
//                 <a href="#" className="text-gray-400 hover:text-white">
//                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
//                     <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
//                   </svg>
//                 </a>
//                 <a href="#" className="text-gray-400 hover:text-white">
//                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
//                     <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z.017 0z"/>
//                   </svg>
//                 </a>
//               </div>
//             </div>
//             <div>
//               <h6 className="font-semibold mb-4">Categorias</h6>
//               <ul className="space-y-2 text-sm text-gray-400">
//                 <li><a href="#" className="hover:text-white transition-colors">Notebooks</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Smartphones</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Tablets</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Componentes</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Periféricos</a></li>
//               </ul>
//             </div>
//             <div>
//               <h6 className="font-semibold mb-4">Suporte</h6>
//               <ul className="space-y-2 text-sm text-gray-400">
//                 <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Fale Conosco</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Política de Troca</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Garantia</a></li>
//                 <li><a href="#" className="hover:text-white transition-colors">Rastreamento</a></li>
//               </ul>
//             </div>
//             <div>
//               <h6 className="font-semibold mb-4">Contato</h6>
//               <div className="space-y-2 text-sm text-gray-400">
//                 <p className="flex items-center">
//                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                   </svg>
//                   (17) 3345-1234
//                 </p>
//                 <p className="flex items-center">
//                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                   </svg>
//                   contato@labstore.com
//                 </p>
//                 <p className="flex items-center">
//                   <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
//                   </svg>
//                   Bebedouro - SP
//                 </p>
//                 <p className="text-xs mt-4">
//                   Seg-Sex: 8h às 18h<br/>
//                   Sáb: 8h às 12h
//                 </p>
//               </div>
//             </div>
//           </div>
//           <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
//             <p>&copy; 2025 LabStore. Todos os direitos reservados.</p>
//             <div className="flex space-x-4 mt-4 md:mt-0">
//               <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
//               <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default Home;