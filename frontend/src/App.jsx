import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from "../components/Homepage";
import Login from "../components/auth/Login";
import Signup from "../components/auth/Signup";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Homepage />} />
      </Routes>
    </Router>
  );
}

export default App;
