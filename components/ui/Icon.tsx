
import React from 'react';
import { IconProps } from '../../types';

// Exemplo de Ícone de Usuário SVG
export const UserIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A18.75 18.75 0 0 1 12 22.5c-2.786 0-5.433-.608-7.499-1.688Z" />
  </svg>
);

// Exemplo de Ícone de Carrinho de Compras SVG
export const ShoppingCartIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
  </svg>
);

// Exemplo de Ícone de Dashboard SVG
export const DashboardIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 .895-.895c.13-.13.044-.344-.138-.344H1.321c-.182 0-.268-.214-.138-.344L2.25 9.75M3.75 12H2.25m1.5 0H4.5m16.5 0h1.5m-1.5 0h-1.5M12 2.25V3.75m0 16.5V21.75m0-16.5c-.13 0-.268.044-.344.138l-.895.895M12 3.75c.13 0 .268.044.344.138l.895.895m0 0c.13.13.344.044.344-.138V1.321c0-.182-.214-.268-.344-.138L12.75 2.25M12 20.25c-.13 0-.268-.044-.344-.138L11.25 19.5m.75.75c.13 0 .268.044.344.138L12.75 19.5m0 0c.13.13.344.044.344-.138V18.182c0-.182-.214-.268-.344-.138L12.75 19.5M6 6.75A.75.75 0 0 1 5.25 6h0A.75.75 0 0 1 6 5.25v0A.75.75 0 0 1 6.75 6h0A.75.75 0 0 1 6 6.75ZM6 18.75A.75.75 0 0 1 5.25 18h0A.75.75 0 0 1 6 17.25v0A.75.75 0 0 1 6.75 18h0A.75.75 0 0 1 6 18.75ZM18 6.75A.75.75 0 0 1 17.25 6h0A.75.75 0 0 1 18 5.25v0A.75.75 0 0 1 18.75 6h0A.75.75 0 0 1 18 6.75ZM18 18.75A.75.75 0 0 1 17.25 18h0A.75.75 0 0 1 18 17.25v0A.75.75 0 0 1 18.75 18h0A.75.75 0 0 1 18 18.75ZM12 12.75a.75.75 0 0 1-.75-.75V9a.75.75 0 0 1 1.5 0v3a.75.75 0 0 1-.75.75Z" />
  </svg>
);

export const ProductIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 8.25 20.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
  </svg>
);

export const CogIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m18 0h-1.5m-15.036-7.149A6.75 6.75 0 0 1 12 4.5c1.183 0 2.295.286 3.286.775L12 12m6.775-4.225A6.75 6.75 0 0 0 12 4.5c-1.183 0-2.295.286-3.286.775L12 12m6.775-4.225 2.525 4.373M4.5 12l-2.525 4.373m19.05 0A7.492 7.492 0 0 1 12 19.5c-2.079 0-3.962-.84-5.303-2.225M12 12l2.525-4.373m-5.05 0L12 12m-5.303 2.225A7.492 7.492 0 0 0 12 19.5c2.079 0 3.962-.84 5.303-2.225M12 12l-2.525 4.373m5.05 0L12 12m.75-10.5V3.75m0 16.5V20.25m-4.503-15.497 1.061 1.061M6.275 5.213l1.061-1.061M20.25 12h1.5M1.5 12h1.5m16.187-5.752-1.061 1.061M6.275 18.787l1.061-1.061m11.889-1.061-1.061-1.061M7.336 17.726l-1.061 1.061" />
  </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-3.741-1.5a3 3 0 0 0-3.741 1.5c1.233.262 2.507.4 3.741.479ZM12 12.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-2.28 4.95a4.032 4.032 0 0 1-1.17-2.532c0-1.44-.99-2.007-1.992-2.82C5.642 11.234 4.5 10.024 4.5 8.25c0-1.923 1.583-3.75 3.998-3.75s3.998 1.827 3.998 3.75c0 1.773-1.142 2.984-2.144 3.798-.992.813-1.992 1.38-1.992 2.82a4.032 4.032 0 0 1-1.17 2.532ZM6 18.72h8.734c.414 0 .75-.336.75-.75s-.336-.75-.75-.75H6c-.414 0-.75.336-.75.75s.336.75.75.75Z" />
  </svg>
);

export const ShieldCheckIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

export const LogoutIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} className={className} {...props}>
   <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);

export const WrenchScrewdriverIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.495-2.495a1.5 1.5 0 0 1 2.122 0l.879.879a1.5 1.5 0 0 1 0 2.122L13.93 17.749M11.42 15.17l-4.243-4.243L5.334 9.083A3.75 3.75 0 0 1 9.083 5.334L10.917 7.167m2.829 5.178L16.5 9.123m-4.243 4.244L6.38 8.166a3.75 3.75 0 0 0-4.243 4.243l.001.001c.001.001.002.001.002.001l1.83 1.83m6.06-6.06L9.75 8.25m3.385 3.385-4.243-4.243" />
  </svg>
);

export const ChatBubbleLeftEllipsisIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
  </svg>
);

export const ListBulletIcon: React.FC<IconProps> = ({ size = 24, className = '', ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={size} height={size} className={className} {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
  </svg>
);