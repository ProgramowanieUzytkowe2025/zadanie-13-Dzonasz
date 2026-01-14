import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const Currencies = () => {
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rateData, setRateData] = useState(null);
  const [error, setError] = useState(null);

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
          const formattedPrevDate = prevDate.toISOString().split('T')[0];
          fetchRate(currency, formattedPrevDate);
          return;
        }
        if (!res.ok) throw new Error('Błąd serwera NBP');
        return res.json();
      })
      .then(data => {
        if (data) setRateData(data);
      })
      .catch(err => setError(err.message));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setRateData(null);
    fetchRate(selectedCurrency, selectedDate);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Kursy walut</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block' }}>Waluta:</label>
          <select value={selectedCurrency} onChange={(e) => setSelectedCurrency(e.target.value)}>
            {availableCurrencies.map(c => (
              <option key={c.code} value={c.code}>{c.currency} ({c.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block' }}>Data:</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <button type="submit" style={{ alignSelf: 'flex-end' }}>Pobierz kurs</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {rateData && (
        <div style={{ padding: '10px', border: '1px solid #ccc' }}>
          <h3>Wynik dla: {rateData.currency}</h3>
          <p>Data notowania: <strong>{rateData.rates[0].effectiveDate}</strong></p>
          <p>Kurs: <strong>{rateData.rates[0].mid} PLN</strong></p>
          {rateData.rates[0].effectiveDate !== selectedDate && (
            <p style={{ color: 'orange' }}>* Wybrana data była dniem wolnym. Pobrano kurs z dnia: {rateData.rates[0].effectiveDate}</p>
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue > 0) setCount(inputValue);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Cena złota</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <label>Liczba ostatnich notowań: </label>
        <input type="number" min="1" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
        <button type="submit">Zaktualizuj</button>
      </form>
      <table border="1" cellPadding="10" style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr style={{ backgroundColor: '#eee' }}>
            <th>Data</th>
            <th>Cena (1g)</th>
          </tr>
        </thead>
        <tbody>
          {gold.map((item, i) => (
            <tr key={i}>
              <td>{item.data}</td>
              <td>{item.cena} zł</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Author = () => (
  <div style={{ padding: '20px' }}>
    <h2>Autor</h2>
    <p>Jonasz Michalik</p>
  </div>
);

function App() {
  return (
    <Router>
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        <nav style={{ padding: '15px', background: '#333', color: '#fff' }}>
          <ul style={{ display: 'flex', listStyle: 'none', gap: '20px', margin: 0 }}>
            <li><Link to="/waluty" style={{ color: '#fff', textDecoration: 'none' }}>Waluty</Link></li>
            <li><Link to="/cena-zlota" style={{ color: '#fff', textDecoration: 'none' }}>Cena Złota</Link></li>
            <li><Link to="/autor" style={{ color: '#fff', textDecoration: 'none' }}>Autor</Link></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/waluty" element={<Currencies />} />
          <Route path="/cena-zlota" element={<GoldPrice />} />
          <Route path="/autor" element={<Author />} />
          <Route path="/" element={<div style={{ padding: '20px' }}>Wybierz opcję z menu.</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;