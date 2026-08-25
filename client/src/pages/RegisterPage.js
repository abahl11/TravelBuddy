import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../api/client';
import ErrorMessage from '../components/ErrorMessage';
import AuthLayout from '../components/AuthLayout';

const INITIAL = {
  fullName: '',
  username: '',
  email: '',
  university: '',
  hometown: '',
  password: '',
  confirmPassword: '',
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: null }));
    setError('');
  };

  // Mirrors the server's rules so mistakes surface before the round trip.
  const validate = () => {
    const errors = {};

    if (form.username.trim().length < 3) {
      errors.username = 'At least 3 characters';
    } else if (!/^[a-zA-Z0-9._-]+$/.test(form.username.trim())) {
      errors.username = 'Letters, numbers, dots, underscores and hyphens only';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (form.password.length < 6) {
      errors.password = 'At least 6 characters';
    } else if (!/\d/.test(form.password)) {
      errors.password = 'Include at least one number';
    }

    if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'The two passwords do not match';
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);
      setError('');

      const { confirmPassword, ...payload } = form;
      await register(payload);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create your account'));
      setLoading(false);
    }
  };

  const field = (name, label, props = {}) => (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={form[name]}
        onChange={handleChange}
        className={`input ${fieldErrors[name] ? 'input-error' : ''}`}
        required
        {...props}
      />
      {fieldErrors[name] && <p className="mt-1.5 text-xs text-red-600">{fieldErrors[name]}</p>}
    </div>
  );

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes a minute, and it is free."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="link">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <ErrorMessage error={error} onDismiss={() => setError('')} />

        <div className="grid gap-5 sm:grid-cols-2">
          {field('fullName', 'Full name', { type: 'text', autoComplete: 'name' })}
          {field('username', 'Username', { type: 'text', autoComplete: 'username' })}
        </div>

        {field('email', 'Email', { type: 'email', autoComplete: 'email' })}

        <div className="grid gap-5 sm:grid-cols-2">
          {field('university', 'University', { type: 'text' })}
          {field('hometown', 'Hometown', { type: 'text' })}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {field('password', 'Password', { type: 'password', autoComplete: 'new-password' })}
          {field('confirmPassword', 'Confirm password', {
            type: 'password',
            autoComplete: 'new-password',
          })}
        </div>

        <p className="text-xs text-ink-400">
          Use at least 6 characters, including a number.
        </p>

        <button type="submit" className="btn-primary btn-lg w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
