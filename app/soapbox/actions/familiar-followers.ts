import { AppDispatch, RootState } from 'soapbox/store';

import api from '../api';

import { importFetchedAccounts } from './importer';

export const FAMILIAR_FOLLOWERS_FETCH_REQUEST = 'FAMILIAR_FOLLOWERS_FETCH_REQUEST';
export const FAMILIAR_FOLLOWERS_FETCH_SUCCESS = 'FAMILIAR_FOLLOWERS_FETCH_SUCCESS';
export const FAMILIAR_FOLLOWERS_FETCH_FAIL    = 'FAMILIAR_FOLLOWERS_FETCH_FAIL';

export const fetchAccountFamiliarFollowers = (accountId: string) => (dispatch: AppDispatch, getState: () => RootState) => {
  dispatch({
    type: FAMILIAR_FOLLOWERS_FETCH_REQUEST,
    id: accountId,
  });

  api(getState).get(`/api/v1/accounts/familiar_followers?id=${accountId}`)
    .then(({ data }) => {
      const accounts = data.find(({ id }: { id: string }) => id === accountId).accounts;

      dispatch(importFetchedAccounts(accounts));
      dispatch({
        type: FAMILIAR_FOLLOWERS_FETCH_SUCCESS,
        id: accountId,
        accounts,
      });
    })
    .catch(error => dispatch({
      type: FAMILIAR_FOLLOWERS_FETCH_FAIL,
      id: accountId,
      error,
    }));
};
