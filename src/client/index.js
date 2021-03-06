/* @flow */

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter } from 'react-router';
import { CodeSplitProvider, rehydrateState } from 'code-split-component';
import { Provider as ReduxProvider } from 'react-redux';
import { rehydrateJobs } from 'react-jobs/ssr';
import configureStore from '../shared/redux/configureStore';
import IntlProvider from '../shared/components/IntlProvider';
import ReactHotLoader from './components/ReactHotLoader';
import ChinaCompare from '../shared/components/ChinaCompare';
import TaskRoutesExecutor from './components/TaskRoutesExecutor';
import { registerLocaleData, polyfillIntlApi } from '../shared/utils/intl';
import { selectIntlLocale } from '../shared/reducers/intl';
import { safeConfigGet } from '../shared/utils/config';

// Get the DOM Element that will host our React application.
const container = document.querySelector('#app');

function createApp() {
  let codeSplitState;
  let locale;
  let store;

  return Promise.resolve(store = configureStore(
    // Server side rendering would have mounted our state on this global.
    window.__APP_STATE__, // eslint-disable-line no-underscore-dangle
  ))
    .then(() => (locale = selectIntlLocale()(store.getState())))
    .then(() => !window.Intl && polyfillIntlApi(locale))
    .then(() => registerLocaleData(locale))
    /*.then(() => {
     const locales = safeConfigGet(['locales']);
     // Register locale data for all locales
     return Promise.all(locales.map(registerLocaleData));
     })*/
    .then(() => rehydrateState())
    .then(stateRehydrated => (codeSplitState = stateRehydrated))
    .then(() => ({ store, codeSplitState }));
}

function renderApp(TheApp) {
  // We use the code-split-component library to provide us with code splitting
  // within our application.  This library supports server rendered applications,
  // but for server rendered applications it requires that we rehydrate any
  // code split modules that may have been rendered for a request.  We use
  // the provided helper and then pass the result to the CodeSplitProvider
  // instance which takes care of the rest for us.  This is really important
  // to do as it will ensure that our React checksum for the client will match
  // the content returned by the server.
  // @see https://github.com/ctrlplusb/code-split-component
  return createApp().then(({ store, codeSplitState }) =>
    render(
      <ReactHotLoader>
        <CodeSplitProvider state={codeSplitState}>
          <ReduxProvider store={store}>
            <IntlProvider>
              <BrowserRouter>
                {
                  // The TaskRoutesExecutor makes sure any data tasks are
                  // executed prior to our route being loaded.
                  // @see ./src/shared/routeTasks/
                  routerProps => (
                    <TaskRoutesExecutor {...routerProps} dispatch={store.dispatch}>
                      <TheApp />
                    </TaskRoutesExecutor>
                  )
                }
              </BrowserRouter>
            </IntlProvider>
          </ReduxProvider>
        </CodeSplitProvider>
      </ReactHotLoader>,
      container
    ),
  );
}

// The following is needed so that we can support hot reloading our application.
if (process.env.NODE_ENV === 'development' && module.hot) {
  // Accept changes to this file for hot reloading.
  module.hot.accept('./index.js');
  // Any changes to our App will cause a hotload re-render.
  module.hot.accept(
    '../shared/components/ChinaCompare',
    () => renderApp(require('../shared/components/ChinaCompare').default),
  );
  // Accept changes to translations for hot reloading.
  module.hot.accept('./i18n');
}

// Execute the first render of our app.
renderApp(ChinaCompare);

// This registers our service worker for asset caching and offline support.
// Keep this as the last item, just in case the code execution failed (thanks
// to react-boilerplate for that tip.)
require('./registerServiceWorker');
