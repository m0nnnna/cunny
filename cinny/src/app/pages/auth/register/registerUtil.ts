import to from 'await-to-js';
import {
  IAuthData,
  MatrixClient,
  MatrixError,
  RegisterRequest,
  RegisterResponse,
} from 'matrix-js-sdk';
import { useEffect } from 'react';
import { LoginPathSearchParams } from '../../paths';
import { ErrorCode } from '../../../cs-errorcode';
import {
  deleteAfterLoginRedirectPath,
  getAfterLoginRedirectPath,
} from '../../afterLoginRedirectPath';
import { getHomePath, getLoginPath, getOriginBaseUrl, withSearchParam } from '../../pathUtils';
import { getMxIdLocalPart, getMxIdServer } from '../../../utils/matrix';
import { setFallbackSession } from '../../../state/sessions';
import { useClientConfig } from '../../../hooks/useClientConfig';

export enum RegisterError {
  UserTaken = 'UserTaken',
  UserInvalid = 'UserInvalid',
  UserExclusive = 'UserExclusive',
  PasswordWeak = 'PasswordWeak',
  PasswordShort = 'PasswordShort',
  InvalidRequest = 'InvalidRequest',
  Forbidden = 'Forbidden',
  RateLimited = 'RateLimited',
  Unknown = 'Unknown',
}

export type CustomRegisterResponse = {
  baseUrl: string;
  response: RegisterResponse;
};
export type RegisterResult = [IAuthData, undefined] | [undefined, CustomRegisterResponse];
export const register = async (
  mx: MatrixClient,
  requestData: RegisterRequest
): Promise<RegisterResult> => {
  const [err, res] = await to<RegisterResponse, MatrixError>(mx.registerRequest(requestData));

  if (err) {
    if (err.httpStatus === 401) {
      const authData = err.data as IAuthData;
      return [authData, undefined];
    }

    if (err.errcode === ErrorCode.M_USER_IN_USE) {
      throw new MatrixError({
        errcode: RegisterError.UserTaken,
      });
    }
    if (err.errcode === ErrorCode.M_INVALID_USERNAME) {
      throw new MatrixError({
        errcode: RegisterError.UserInvalid,
      });
    }
    if (err.errcode === ErrorCode.M_EXCLUSIVE) {
      throw new MatrixError({
        errcode: RegisterError.UserExclusive,
      });
    }
    if (err.errcode === ErrorCode.M_WEAK_PASSWORD) {
      throw new MatrixError({
        errcode: RegisterError.PasswordWeak,
        error: err.data.error,
      });
    }
    if (err.errcode === ErrorCode.M_PASSWORD_TOO_SHORT) {
      throw new MatrixError({
        errcode: RegisterError.PasswordShort,
        error: err.data.error,
      });
    }

    if (err.httpStatus === 429) {
      throw new MatrixError({
        errcode: RegisterError.RateLimited,
      });
    }

    if (err.httpStatus === 400) {
      throw new MatrixError({
        errcode: RegisterError.InvalidRequest,
      });
    }

    if (err.httpStatus === 403) {
      throw new MatrixError({
        errcode: RegisterError.Forbidden,
      });
    }

    throw new MatrixError({
      errcode: RegisterError.Unknown,
      error: err.data.error,
    });
  }
  return [
    undefined,
    {
      baseUrl: mx.baseUrl,
      response: res,
    },
  ];
};

function buildFullUrl(path: string, hashRouter?: { enabled?: boolean; basename?: string }): string {
  const base = getOriginBaseUrl(hashRouter);
  if (base.includes('#')) {
    return base + path.replace(/^\//, '');
  }
  return base.replace(/\/$/, '') + (path.startsWith('/') ? path : `/${path}`);
}

export const useRegisterComplete = (data?: CustomRegisterResponse) => {
  const { hashRouter } = useClientConfig();

  useEffect(() => {
    if (data) {
      const { response, baseUrl } = data;

      const userId = response.user_id;
      const accessToken = response.access_token;
      const deviceId = response.device_id;

      if (accessToken && deviceId) {
        setFallbackSession(accessToken, deviceId, userId, baseUrl);
        const afterLoginRedirectPath = getAfterLoginRedirectPath();
        deleteAfterLoginRedirectPath();
        const path = afterLoginRedirectPath ?? getHomePath();
        // Full page navigation so the app re-initializes with the new session
        window.location.assign(buildFullUrl(path, hashRouter));
      } else {
        const username = getMxIdLocalPart(userId);
        const userServer = getMxIdServer(userId);
        const loginPath = withSearchParam<LoginPathSearchParams>(getLoginPath(userServer), {
          username,
        });
        window.location.assign(buildFullUrl(loginPath, hashRouter));
      }
    }
  }, [data, hashRouter]);
};
