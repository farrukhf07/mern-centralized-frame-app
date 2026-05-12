import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import AppsList from './pages/AppsList';
import CategoriesList from './pages/CategoriesList';
import CreateCategory from './pages/CreateCategory';
import AddExistingCategory from './pages/AddExistingCategory';
import EditCategory from './pages/EditCategory';
import AssetsList from './pages/AssetsList';
import CreateAsset from './pages/CreateAsset';
import EditAsset from './pages/EditAsset';
import AddExistingAssets from './pages/AddExistingAssets';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AppPermissionRoute from './components/AppPermissionRoute';
import UpdateUser from './pages/UpdateUser';
import ContactUs from './pages/ContactUs';
import CentralData from './pages/CentralData';
import CategoryAssets from './pages/CategoryAssets';
import AllAssets from './pages/AllAssets';
import ContactRequests from './pages/ContactRequests';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes inside Layout */}
          <Route element={<Layout />}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories/:appId"
              element={
                <ProtectedRoute>
                  <CategoriesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-category"
              element={
                <ProtectedRoute adminOnly>
                  <CreateCategory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-category/:appId"
              element={
                <ProtectedRoute>
                  <AppPermissionRoute>
                    <CreateCategory />
                  </AppPermissionRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-category/:categoryId"
              element={
                <ProtectedRoute>
                  <EditCategory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-existing/:appId"
              element={
                <ProtectedRoute>
                  <AppPermissionRoute>
                    <AddExistingCategory />
                  </AppPermissionRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/assets/:appId/:categoryId"
              element={
                <ProtectedRoute>
                  <AssetsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-asset/:categoryId"
              element={
                <ProtectedRoute adminOnly>
                  <CreateAsset />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-asset/:appId/:categoryId"
              element={
                <ProtectedRoute>
                  <AppPermissionRoute>
                    <CreateAsset />
                  </AppPermissionRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-asset/:appId/:categoryId/:assetId"
              element={
                <ProtectedRoute>
                  <AppPermissionRoute>
                    <EditAsset />
                  </AppPermissionRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-existing-assets/:appId/:categoryId"
              element={
                <ProtectedRoute>
                  <AppPermissionRoute>
                    <AddExistingAssets />
                  </AppPermissionRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <UpdateUser />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contact-requests"
              element={
                <ProtectedRoute adminOnly>
                  <ContactRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/central-data"
              element={
                <ProtectedRoute adminOnly>
                  <CentralData />
                </ProtectedRoute>
              }
            />
            <Route
              path="/central-data/assets/:categoryId"
              element={
                <ProtectedRoute adminOnly>
                  <CategoryAssets />
                </ProtectedRoute>
              }
            />
            <Route
              path="/all-assets"
              element={
                <ProtectedRoute adminOnly>
                  <AllAssets />
                </ProtectedRoute>
              }
            />
            <Route path="/contactUs" element={<ContactUs />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
