import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './App.css';

const CurrencyDetails = () => {
  const { waluta } = useParams();
  const [history, setHistory] = useState([]);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`https://api.nbp.pl/api/exchangerates/rates/a/${waluta}/last/30/?format=json`)
      .then(res => {
        if (!res.ok) throw new Error('Nie znaleziono danych');
        return res.json();
      })
      .then(data => {
        setDetails({ name: data.currency, code: data.code });
        const chartData = data.rates.map(item => ({
          date: item.effectiveDate,
          price: item.mid
        }));
        setHistory(chartData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [waluta]);

  if (loading) return <div className="page-content">Ładowanie historii wykresu...</div>;
  if (!details) return <div className="page-content">Błąd: Nie znaleziono danych dla waluty {waluta}</div>;

  return (
    <div className="page-content">
      <h2>Szczegóły: {details.name} ({details.code})</h2>
      
      <div className="chart-wrapper">
        <h3>Zmiana kursu (ostatnie 30 notowań)</h3>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis domain={['auto', 'auto']} tick={{fontSize: 12}} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="price" 
                name={`Kurs ${details.code}/PLN`} 
                stroke="#3498db" 
                strokeWidth={3}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <Link to="/waluty" className="btn-nav" style={{textDecoration: 'none', color: '#3498db'}}>← Powrót do wyszukiwarki</Link>
      </div>
    </div>
  );
};

const Currencies = () => {
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rateData, setRateData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('https://api.nbp.pl/api/exchangerates/tables/a/?format=json')
      .then(res => res.json())
      .then(data => setAvailableCurrencies(data[0].rates))
      .catch(err => console.error(err));
  }, []);

  const fetchRate = (currency, date) => {
    fetch(`https://api.nbp.pl/api/exchangerates/rates/a/${currency}/${date}/?format=json`)
      .then(res => {
        if (res.status === 404) {
          const prevDate = new Date(date);
          prevDate.setDate(prevDate.getDate() - 1);
          fetchRate(currency, prevDate.toISOString().split('T')[0]);
          return;
        }
        if (!res.ok) throw new Error('Błąd serwera NBP');
        return res.json();
      })
      .then(data => { if (data) setRateData(data); })
      .catch(err => setError(err.message));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setRateData(null);
    fetchRate(selectedCurrency, selectedDate);
  };

  return (
    <div className="page-content">
      <h2>Kursy walut</h2>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label>Waluta:</label>
          <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}>
            {availableCurrencies.map(c => (
              <option key={c.code} value={c.code}>{c.currency} ({c.code})</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Data:</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <button type="submit">Pobierz kurs</button>
        <button type="button" className="btn-details" onClick={() => navigate(`/waluty/${selectedCurrency}`)}>
          Przejdź do szczegółów
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}
      {rateData && (
        <div className="result-box">
          <h3>{rateData.currency} ({rateData.code})</h3>
          <p>Data: <strong>{rateData.rates[0].effectiveDate}</strong></p>
          <p>Kurs: <strong>{rateData.rates[0].mid} PLN</strong></p>
          {rateData.rates[0].effectiveDate !== selectedDate && (
            <p className="info-text">* Brak notowania w wybranym dniu. Wyświetlono najbliższy dostępny kurs.</p>
          )}
        </div>
      )}
    </div>
  );
};

const GoldPrice = () => {
  const [gold, setGold] = useState([]);
  const [count, setCount] = useState(10);
  const [inputValue, setInputValue] = useState(10);

  useEffect(() => {
    fetch(`https://api.nbp.pl/api/cenyzlota/last/${count}/?format=json`)
      .then(res => res.json())
      .then(data => setGold(data))
      .catch(err => console.error(err));
  }, [count]);

  return (
    <div className="page-content">
      <h2>Cena złota</h2>
      <form onSubmit={(e) => { e.preventDefault(); setCount(inputValue); }} className="form-container">
        <label>Liczba notowań: </label>
        <input type="number" min="1" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
        <button type="submit">Zaktualizuj</button>
      </form>
      <table className="gold-table">
        <thead>
          <tr><th>Data</th><th>Cena (1g)</th></tr>
        </thead>
        <tbody>
          {gold.map((item, i) => (
            <tr key={i}><td>{item.data}</td><td>{item.cena} zł</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Author = () => (
  <div className="page-content">
    <h2>Autor:</h2>
    <p><strong>Jonasz Michalik</strong></p>
  </div>
);

// --- GŁÓWNA APLIKACJA ---
function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="nav-bar">
          <ul className="nav-list">
            <li><Link to="/waluty" className="nav-link">Waluty</Link></li>
            <li><Link to="/cena-zlota" className="nav-link">Cena Złota</Link></li>
            <li><Link to="/autor" className="nav-link">Autor</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/waluty" element={<Currencies />} />
          <Route path="/waluty/:waluta" element={<CurrencyDetails />} />
          <Route path="/cena-zlota" element={<GoldPrice />} />
          <Route path="/autor" element={<Author />} />
          <Route path="/" element={<div className="page-content">Witaj! Wybierz opcję z menu powyżej.</div>} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;