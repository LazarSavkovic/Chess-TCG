// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, SignIn, RedirectToSignIn } from '@clerk/clerk-react';

import Room from './components/Room';
import Layout from './components/Layout';
import Home from './components/Home';
import DeckBuilder from './components/DeckBuilder';
import DecksPage from './components/DecksPage';

function App() {
  return (
    <>
      {/* Signed-in users can access the app routes */}
      <SignedIn>
        <Routes>
          {/* Home has a navbar via the layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
<Route path="/builder" element={<DeckBuilder />} />          {/* create */}
<Route path="/builder/:deckId" element={<DeckBuilder />} />  {/* edit */}

      <Route path="/decks" element={<DecksPage />} />
          </Route>

          {/* Room has no navbar */}
          <Route path="/room/:id" element={<Room />} />

          {/* Optional: a sign-in route even when signed in (usually not needed) */}
          <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
        </Routes>
      </SignedIn>

      {/* Signed-out users are routed to Sign In */}
      <SignedOut>
        <Routes>
          <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
          <Route path="*" element={<RedirectToSignIn />} />
        </Routes>
      </SignedOut>
    </>
  );
}

export default App;
