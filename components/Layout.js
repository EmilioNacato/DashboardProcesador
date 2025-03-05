import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';

const Layout = ({ children, title = '' }) => {
  const router = useRouter();
  
  // Verifica si la ruta actual coincide con la del enlace
  const isActive = (path) => {
    return router.pathname === path ? 'active' : '';
  };

  return (
    <div className="layout">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Dashboard de transacciones para sistema Banquito" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="header">
        <div className="logo">
          <h1>Banquito</h1>
        </div>
        <div className="user-info">
          <span className="user-name">Admin</span>
          <img 
            src="https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff" 
            alt="Admin" 
            className="user-avatar"
          />
        </div>
      </header>

      <div className="container">
        <aside className="sidebar">
          <nav className="nav">
            <ul>
              <li className={isActive('/')}>
                <Link href="/" legacyBehavior>
                  <a className="nav-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    <span>Dashboard</span>
                  </a>
                </Link>
              </li>
              <li className={isActive('/transactions')}>
                <Link href="/transactions" legacyBehavior>
                  <a className="nav-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    <span>Transacciones</span>
                  </a>
                </Link>
              </li>
              <li className={isActive('/fraude')}>
                <Link href="/fraude" legacyBehavior>
                  <a className="nav-link">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 8v4M12 16h.01"></path></svg>
                    <span>Transacciones Fraudulentas</span>
                  </a>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        <main className="main-content">
          <div className="page-header">
            <h2>{title}</h2>
          </div>
          {children}
        </main>
      </div>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Banquito. Todos los derechos reservados.</p>
      </footer>

      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        ul {
          list-style: none;
        }
      `}</style>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .header {
          background-color: #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 0 20px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo h1 {
          color: #3f51b5;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .container {
          display: flex;
          flex: 1;
        }

        .sidebar {
          width: 240px;
          background-color: #ffffff;
          box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
          padding: 20px 0;
        }

        .nav-link {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          color: #555;
          transition: all 0.3s;
          gap: 10px;
        }

        .nav-link:hover {
          background-color: #f5f5f5;
          color: #3f51b5;
        }

        .nav li.active .nav-link {
          background-color: #ede7f6;
          color: #3f51b5;
          border-left: 3px solid #3f51b5;
        }

        .main-content {
          flex: 1;
          padding: 30px;
          overflow-y: auto;
        }

        .page-header {
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-header h2 {
          font-size: 1.8rem;
          font-weight: 600;
          color: #333;
        }

        .footer {
          background-color: #ffffff;
          padding: 15px 20px;
          text-align: center;
          color: #777;
          font-size: 0.9rem;
          border-top: 1px solid #eee;
        }
      `}</style>
    </div>
  );
};

export default Layout; 