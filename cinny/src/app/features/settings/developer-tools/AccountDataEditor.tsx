import React, {
  FormEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Box,
  Text,
  Icon,
  Icons,
  IconButton,
  Input,
  Button,
  TextArea as TextAreaComponent,
  color,
  Spinner,
  Chip,
  Scroll,
  config,
} from 'folds';
import { isKeyHotkey } from 'is-hotkey';
import { MatrixError } from 'matrix-js-sdk';
import * as css from './styles.css';
import { useTextAreaIntentHandler } from '../../../hooks/useTextAreaIntent';
import { Cursor, Intent, TextArea, TextAreaOperations } from '../../../plugins/text-area';
import { GetTarget } from '../../../plugins/text-area/type';
import { syntaxErrorPosition } from '../../../utils/dom';
import { AsyncStatus, useAsyncCallback } from '../../../hooks/useAsyncCallback';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { Page, PageHeader } from '../../../components/page';
import { useAlive } from '../../../hooks/useAlive';
import { SequenceCard } from '../../../components/sequence-card';
import { TextViewerContent } from '../../../components/text-viewer';

const EDITOR_INTENT_SPACE_COUNT = 2;

type AccountDataInfo = {
  type: string;
  content: object;
};

type AccountDataEditProps = {
  type: string;
  defaultContent: string;
  onCancel: () => void;
  onSave: (info: AccountDataInfo) => void;
};
function AccountDataEdit({ type, defaultContent, onCancel, onSave }: AccountDataEditProps) {
  const mx = useMatrixClient();
  const alive = useAlive();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [jsonError, setJSONError] = useState<SyntaxError>();

  const getTarget: GetTarget = useCallback(() => {
    const target = textAreaRef.current;
    if (!target) throw new Error('TextArea element not found!');
    return target;
  }, []);

  const { textArea, operations, intent } = useMemo(() => {
    const ta = new TextArea(getTarget);
    const op = new TextAreaOperations(getTarget);
    return {
      textArea: ta,
      operations: op,
      intent: new Intent(EDITOR_INTENT_SPACE_COUNT, ta, op),
    };
  }, [getTarget]);

  const intentHandler = useTextAreaIntentHandler(textArea, operations, intent);

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (evt) => {
    intentHandler(evt);
    if (isKeyHotkey('escape', evt)) {
      const cursor = Cursor.fromTextAreaElement(getTarget());
      operations.deselect(cursor);
    }
  };

  const [submitState, submit] = useAsyncCallback<object, MatrixError, [string, object]>(
    useCallback((dataType, data) => mx.setAccountData(dataType, data), [mx])
  );
  const submitting = submitState.status === AsyncStatus.Loading;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (evt) => {
    evt.preventDefault();
    if (submitting) return;

    const target = evt.target as HTMLFormElement | undefined;
    const typeInput = target?.typeInput as HTMLInputElement | undefined;
    const contentTextArea = target?.contentTextArea as HTMLTextAreaElement | undefined;
    if (!typeInput || !contentTextArea) return;

    const typeStr = typeInput.value.trim();
    const contentStr = contentTextArea.value.trim();

    let parsedContent: object;
    try {
      parsedContent = JSON.parse(contentStr);
    } catch (e) {
      setJSONError(e as SyntaxError);
      return;
    }
    setJSONError(undefined);

    if (
      !typeStr ||
      parsedContent === null ||
      defaultContent === JSON.stringify(parsedContent, null, EDITOR_INTENT_SPACE_COUNT)
    ) {
      return;
    }

    submit(typeStr, parsedContent).then(() => {
      if (alive()) {
        onSave({
          type: typeStr,
          content: parsedContent,
        });
      }
    });
  };

  useEffect(() => {
    if (jsonError) {
      const errorPosition = syntaxErrorPosition(jsonError) ?? 0;
      const cursor = new Cursor(errorPosition, errorPosition, 'none');
      operations.select(cursor);
      getTarget()?.focus();
    }
  }, [jsonError, operations, getTarget]);

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      grow="Yes"
      className={css.EditorContent}
      direction="Column"
      gap="400"
      aria-disabled={submitting}
    >
      <Box shrink="No" direction="Column" gap="100">
        <Text size="L400">Account Data</Text>
        <Box gap="300">
          <Box grow="Yes" direction="Column">
            <Input
              variant={type.length > 0 || submitting ? 'SurfaceVariant' : 'Background'}
              name="typeInput"
              size="400"
              radii="300"
              readOnly={type.length > 0 || submitting}
              defaultValue={type}
              required
            />
          </Box>
          <Button
            variant="Success"
            size="400"
            radii="300"
            type="submit"
            disabled={submitting}
            before={submitting && <Spinner variant="Primary" fill="Solid" size="300" />}
          >
            <Text size="B400">Save</Text>
          </Button>
          <Button
            variant="Secondary"
            fill="Soft"
            size="400"
            radii="300"
            onClick={onCancel}
            disabled={submitting}
          >
            <Text size="B400">Cancel</Text>
          </Button>
        </Box>

        {submitState.status === AsyncStatus.Error && (
          <Text size="T200" style={{ color: color.Critical.Main }}>
            <b>{submitState.error.message}</b>
          </Text>
        )}
      </Box>
      <Box grow="Yes" direction="Column" gap="100">
        <Box shrink="No">
          <Text size="L400">JSON Content</Text>
        </Box>
        <TextAreaComponent
          ref={textAreaRef}
          name="contentTextArea"
          className={css.EditorTextArea}
          onKeyDown={handleKeyDown}
          defaultValue={defaultContent}
          resize="None"
          spellCheck="false"
          required
          readOnly={submitting}
        />
        {jsonError && (
          <Text size="T200" style={{ color: color.Critical.Main }}>
            <b>
              {jsonError.name}: {jsonError.message}
            </b>
          </Text>
        )}
      </Box>
    </Box>
  );
}

type AccountDataViewProps = {
  type: string;
  defaultContent: string;
  onEdit: () => void;
};
function AccountDataView({ type, defaultContent, onEdit }: AccountDataViewProps) {
  return (
    <Box direction="Column" className={css.EditorContent} gap="400">
      <Box shrink="No" gap="300" alignItems="End">
        <Box grow="Yes" direction="Column" gap="100">
          <Text size="L400">Account Data</Text>
          <Input
            variant="SurfaceVariant"
            size="400"
            radii="300"
            readOnly
            defaultValue={type}
            required
          />
        </Box>
        <Button variant="Secondary" size="400" radii="300" onClick={onEdit}>
          <Text size="B400">Edit</Text>
        </Button>
      </Box>
      <Box grow="Yes" direction="Column" gap="100">
        <Text size="L400">JSON Content</Text>
        <SequenceCard variant="SurfaceVariant">
          <Scroll visibility="Always" size="300" hideTrack>
            <TextViewerContent
              size="T300"
              style={{
                padding: `${config.space.S300} ${config.space.S100} ${config.space.S300} ${config.space.S300}`,
              }}
              text={defaultContent}
              langName="JSON"
            />
          </Scroll>
        </SequenceCard>
      </Box>
    </Box>
  );
}

export type AccountDataEditorProps = {
  type?: string;
  requestClose: () => void;
};

export function AccountDataEditor({ type, requestClose }: AccountDataEditorProps) {
  const mx = useMatrixClient();

  const [data, setData] = useState<AccountDataInfo>({
    type: type ?? '',
    content: mx.getAccountData(type ?? '')?.getContent() ?? {},
  });

  const [edit, setEdit] = useState(!type);

  const closeEdit = useCallback(() => {
    if (!type) {
      requestClose();
      return;
    }
    setEdit(false);
  }, [type, requestClose]);

  const handleSave = useCallback((info: AccountDataInfo) => {
    setData(info);
    setEdit(false);
  }, []);

  const contentJSONStr = useMemo(
    () => JSON.stringify(data.content, null, EDITOR_INTENT_SPACE_COUNT),
    [data.content]
  );

  return (
    <Page>
      <PageHeader outlined={false} balance>
        <Box alignItems="Center" grow="Yes" gap="200">
          <Box alignItems="Inherit" grow="Yes" gap="200">
            <Chip
              size="500"
              radii="Pill"
              onClick={requestClose}
              before={<Icon size="100" src={Icons.ArrowLeft} />}
            >
              <Text size="T300">Developer Tools</Text>
            </Chip>
          </Box>
          <Box shrink="No">
            <IconButton onClick={requestClose} variant="Surface">
              <Icon src={Icons.Cross} />
            </IconButton>
          </Box>
        </Box>
      </PageHeader>
      <Box grow="Yes" direction="Column">
        {edit ? (
          <AccountDataEdit
            type={data.type}
            defaultContent={contentJSONStr}
            onCancel={closeEdit}
            onSave={handleSave}
          />
        ) : (
          <AccountDataView
            type={data.type}
            defaultContent={contentJSONStr}
            onEdit={() => setEdit(true)}
          />
        )}
      </Box>
    </Page>
  );
}
