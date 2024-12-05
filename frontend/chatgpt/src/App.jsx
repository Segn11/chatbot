import { Routes, Route } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Signup from './pages/Signup';
import Chat from './pages/Chat';
import Notfound from './pages/Notfound';
import Login from './pages/Login';
import Header from './components/Header/Header';

const App = () => {
  return (
    <div className="flex flex-col min-h-screen px-4 md:px-10 bg-gray-100"> {/* Full height flex container */}
      <Header />
      <main className="flex-grow  pt-3"> {/* The main content container takes the remaining height */}
        <Routes>
          <Route path='/' element={<Homepage />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/chat' element={<Chat />} />
          <Route path='*' element={<Notfound />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
