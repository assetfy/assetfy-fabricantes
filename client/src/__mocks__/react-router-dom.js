const React = require('react');

const mockNavigate = jest.fn();

const BrowserRouter = ({ children }) => React.createElement('div', null, children);
const Routes = ({ children }) => React.createElement('div', null, children);
const Route = ({ element }) => element;
const Navigate = ({ to }) => React.createElement('div', { 'data-testid': `navigate-${to}` });
const Link = ({ children, ...props }) => React.createElement('a', props, children);

const useNavigate = () => mockNavigate;
const useLocation = () => ({ pathname: '/' });
const useParams = () => ({});

module.exports = {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useLocation,
  useParams,
  __esModule: true,
  default: {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    Link,
    useNavigate,
    useLocation,
    useParams,
  },
};
