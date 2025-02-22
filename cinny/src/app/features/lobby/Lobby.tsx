import React, { MouseEventHandler, useCallback, useMemo, useRef, useState } from 'react';
import { Box, Icon, IconButton, Icons, Line, Scroll, config } from 'folds';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAtom, useAtomValue } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { JoinRule, RestrictedAllowType, Room } from 'matrix-js-sdk';
import { RoomJoinRulesEventContent } from 'matrix-js-sdk/lib/types';
import { IHierarchyRoom } from 'matrix-js-sdk/lib/@types/spaces';
import produce from 'immer';
import { useSpace } from '../../hooks/useSpace';
import { Page, PageContent, PageContentCenter, PageHeroSection } from '../../components/page';
import {
  HierarchyItem,
  HierarchyItemSpace,
  useSpaceHierarchy,
} from '../../hooks/useSpaceHierarchy';
import { VirtualTile } from '../../components/virtualizer';
import { spaceRoomsAtom } from '../../state/spaceRooms';
import { MembersDrawer } from '../room/MembersDrawer';
import { useSetting } from '../../state/hooks/settings';
import { ScreenSize, useScreenSizeContext } from '../../hooks/useScreenSize';
import { settingsAtom } from '../../state/settings';
import { LobbyHeader } from './LobbyHeader';
import { LobbyHero } from './LobbyHero';
import { ScrollTopContainer } from '../../components/scroll-top-container';
import { useElementSizeObserver } from '../../hooks/useElementSizeObserver';
import {
  IPowerLevels,
  PowerLevelsContextProvider,
  powerLevelAPI,
  usePowerLevels,
  useRoomsPowerLevels,
} from '../../hooks/usePowerLevels';
import { mDirectAtom } from '../../state/mDirectList';
import { makeLobbyCategoryId } from '../../state/closedLobbyCategories';
import { useCategoryHandler } from '../../hooks/useCategoryHandler';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { getCanonicalAliasOrRoomId } from '../../utils/matrix';
import { getSpaceRoomPath } from '../../pages/pathUtils';
import { StateEvent } from '../../../types/matrix/room';
import { CanDropCallback, useDnDMonitor } from './DnD';
import { ASCIILexicalTable, orderKeys } from '../../utils/ASCIILexicalTable';
import { getStateEvent } from '../../utils/room';
import { useClosedLobbyCategoriesAtom } from '../../state/hooks/closedLobbyCategories';
import {
  makeCinnySpacesContent,
  sidebarItemWithout,
  useSidebarItems,
} from '../../hooks/useSidebarItems';
import { useOrphanSpaces } from '../../state/hooks/roomList';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import { AccountDataEvent } from '../../../types/matrix/accountData';
import { useRoomMembers } from '../../hooks/useRoomMembers';
import { SpaceHierarchy } from './SpaceHierarchy';

export function Lobby() {
  const navigate = useNavigate();
  const mx = useMatrixClient();
  const mDirects = useAtomValue(mDirectAtom);
  const allRooms = useAtomValue(allRoomsAtom);
  const allJoinedRooms = useMemo(() => new Set(allRooms), [allRooms]);
  const space = useSpace();
  const spacePowerLevels = usePowerLevels(space);
  const lex = useMemo(() => new ASCIILexicalTable(' '.charCodeAt(0), '~'.charCodeAt(0), 6), []);
  const members = useRoomMembers(mx, space.roomId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const [heroSectionHeight, setHeroSectionHeight] = useState<number>();
  const [spaceRooms, setSpaceRooms] = useAtom(spaceRoomsAtom);
  const [isDrawer] = useSetting(settingsAtom, 'isPeopleDrawer');
  const screenSize = useScreenSizeContext();
  const [onTop, setOnTop] = useState(true);
  const [closedCategories, setClosedCategories] = useAtom(useClosedLobbyCategoriesAtom());
  const [sidebarItems] = useSidebarItems(
    useOrphanSpaces(mx, allRoomsAtom, useAtomValue(roomToParentsAtom))
  );
  const sidebarSpaces = useMemo(() => {
    const sideSpaces = sidebarItems.flatMap((item) => {
      if (typeof item === 'string') return item;
      return item.content;
    });

    return new Set(sideSpaces);
  }, [sidebarItems]);

  const [spacesItems, setSpacesItem] = useState<Map<string, IHierarchyRoom>>(() => new Map());

  useElementSizeObserver(
    useCallback(() => heroSectionRef.current, []),
    useCallback((w, height) => setHeroSectionHeight(height), [])
  );

  const getRoom = useCallback(
    (rId: string) => {
      if (allJoinedRooms.has(rId)) {
        return mx.getRoom(rId) ?? undefined;
      }
      return undefined;
    },
    [mx, allJoinedRooms]
  );

  const canEditSpaceChild = useCallback(
    (powerLevels: IPowerLevels) =>
      powerLevelAPI.canSendStateEvent(
        powerLevels,
        StateEvent.SpaceChild,
        powerLevelAPI.getPowerLevel(powerLevels, mx.getUserId() ?? undefined)
      ),
    [mx]
  );

  const [draggingItem, setDraggingItem] = useState<HierarchyItem>();
  const hierarchy = useSpaceHierarchy(
    space.roomId,
    spaceRooms,
    getRoom,
    useCallback(
      (childId) =>
        closedCategories.has(makeLobbyCategoryId(space.roomId, childId)) ||
        (draggingItem ? 'space' in draggingItem : false),
      [closedCategories, space.roomId, draggingItem]
    )
  );

  const virtualizer = useVirtualizer({
    count: hierarchy.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 1,
    overscan: 2,
    paddingStart: heroSectionHeight ?? 258,
  });
  const vItems = virtualizer.getVirtualItems();

  const roomsPowerLevels = useRoomsPowerLevels(
    useMemo(
      () =>
        hierarchy
          .flatMap((i) => {
            const childRooms = Array.isArray(i.rooms)
              ? i.rooms.map((r) => mx.getRoom(r.roomId))
              : [];

            return [mx.getRoom(i.space.roomId), ...childRooms];
          })
          .filter((r) => !!r) as Room[],
      [mx, hierarchy]
    )
  );

  const canDrop: CanDropCallback = useCallback(
    (item, container): boolean => {
      const restrictedItem = mx.getRoom(item.roomId)?.getJoinRule() === JoinRule.Restricted;
      if (item.roomId === container.item.roomId || item.roomId === container.nextRoomId) {
        // can not drop before or after itself
        return false;
      }

      if ('space' in item) {
        if (!('space' in container.item)) return false;
        const containerSpaceId = space.roomId;

        if (
          getRoom(containerSpaceId) === undefined ||
          !canEditSpaceChild(roomsPowerLevels.get(containerSpaceId) ?? {})
        ) {
          return false;
        }

        return true;
      }

      const containerSpaceId =
        'space' in container.item ? container.item.roomId : container.item.parentId;

      const dropOutsideSpace = item.parentId !== containerSpaceId;

      if (dropOutsideSpace && restrictedItem) {
        // do not allow restricted room to drop outside
        // current space if can't change join rule allow
        const itemPowerLevel = roomsPowerLevels.get(item.roomId) ?? {};
        const userPLInItem = powerLevelAPI.getPowerLevel(
          itemPowerLevel,
          mx.getUserId() ?? undefined
        );
        const canChangeJoinRuleAllow = powerLevelAPI.canSendStateEvent(
          itemPowerLevel,
          StateEvent.RoomJoinRules,
          userPLInItem
        );
        if (!canChangeJoinRuleAllow) {
          return false;
        }
      }

      if (
        getRoom(containerSpaceId) === undefined ||
        !canEditSpaceChild(roomsPowerLevels.get(containerSpaceId) ?? {})
      ) {
        return false;
      }
      return true;
    },
    [getRoom, space.roomId, roomsPowerLevels, canEditSpaceChild, mx]
  );

  const reorderSpace = useCallback(
    (item: HierarchyItemSpace, containerItem: HierarchyItem) => {
      if (!item.parentId) return;

      const itemSpaces: HierarchyItemSpace[] = hierarchy
        .map((i) => i.space)
        .filter((i) => i.roomId !== item.roomId);

      const beforeIndex = itemSpaces.findIndex((i) => i.roomId === containerItem.roomId);
      const insertIndex = beforeIndex + 1;

      itemSpaces.splice(insertIndex, 0, {
        ...item,
        content: { ...item.content, order: undefined },
      });

      const currentOrders = itemSpaces.map((i) => {
        if (typeof i.content.order === 'string' && lex.has(i.content.order)) {
          return i.content.order;
        }
        return undefined;
      });

      const newOrders = orderKeys(lex, currentOrders);

      newOrders?.forEach((orderKey, index) => {
        const itm = itemSpaces[index];
        if (!itm || !itm.parentId) return;
        const parentPL = roomsPowerLevels.get(itm.parentId);
        const canEdit = parentPL && canEditSpaceChild(parentPL);
        if (canEdit && orderKey !== currentOrders[index]) {
          mx.sendStateEvent(
            itm.parentId,
            StateEvent.SpaceChild as any,
            { ...itm.content, order: orderKey },
            itm.roomId
          );
        }
      });
    },
    [mx, hierarchy, lex, roomsPowerLevels, canEditSpaceChild]
  );

  const reorderRoom = useCallback(
    (item: HierarchyItem, containerItem: HierarchyItem): void => {
      const itemRoom = mx.getRoom(item.roomId);
      if (!item.parentId) {
        return;
      }
      const containerParentId: string =
        'space' in containerItem ? containerItem.roomId : containerItem.parentId;
      const itemContent = item.content;

      if (item.parentId !== containerParentId) {
        mx.sendStateEvent(item.parentId, StateEvent.SpaceChild as any, {}, item.roomId);
      }

      if (
        itemRoom &&
        itemRoom.getJoinRule() === JoinRule.Restricted &&
        item.parentId !== containerParentId
      ) {
        // change join rule allow parameter when dragging
        // restricted room from one space to another
        const joinRuleContent = getStateEvent(
          itemRoom,
          StateEvent.RoomJoinRules
        )?.getContent<RoomJoinRulesEventContent>();

        if (joinRuleContent) {
          const allow =
            joinRuleContent.allow?.filter((allowRule) => allowRule.room_id !== item.parentId) ?? [];
          allow.push({ type: RestrictedAllowType.RoomMembership, room_id: containerParentId });
          mx.sendStateEvent(itemRoom.roomId, StateEvent.RoomJoinRules as any, {
            ...joinRuleContent,
            allow,
          });
        }
      }

      const itemSpaces = Array.from(
        hierarchy?.find((i) => i.space.roomId === containerParentId)?.rooms ?? []
      );

      const beforeItem: HierarchyItem | undefined =
        'space' in containerItem ? undefined : containerItem;
      const beforeIndex = itemSpaces.findIndex((i) => i.roomId === beforeItem?.roomId);
      const insertIndex = beforeIndex + 1;

      itemSpaces.splice(insertIndex, 0, {
        ...item,
        parentId: containerParentId,
        content: { ...itemContent, order: undefined },
      });

      const currentOrders = itemSpaces.map((i) => {
        if (typeof i.content.order === 'string' && lex.has(i.content.order)) {
          return i.content.order;
        }
        return undefined;
      });

      const newOrders = orderKeys(lex, currentOrders);

      newOrders?.forEach((orderKey, index) => {
        const itm = itemSpaces[index];
        if (itm && orderKey !== currentOrders[index]) {
          mx.sendStateEvent(
            containerParentId,
            StateEvent.SpaceChild as any,
            { ...itm.content, order: orderKey },
            itm.roomId
          );
        }
      });
    },
    [mx, hierarchy, lex]
  );

  useDnDMonitor(
    scrollRef,
    setDraggingItem,
    useCallback(
      (item, container) => {
        if (!canDrop(item, container)) {
          return;
        }
        if ('space' in item) {
          reorderSpace(item, container.item);
        } else {
          reorderRoom(item, container.item);
        }
      },
      [reorderRoom, reorderSpace, canDrop]
    )
  );

  const handleSpacesFound = useCallback(
    (sItems: IHierarchyRoom[]) => {
      setSpaceRooms({ type: 'PUT', roomIds: sItems.map((i) => i.room_id) });
      setSpacesItem((current) => {
        const newItems = produce(current, (draft) => {
          sItems.forEach((item) => draft.set(item.room_id, item));
        });
        return current.size === newItems.size ? current : newItems;
      });
    },
    [setSpaceRooms]
  );

  const handleCategoryClick = useCategoryHandler(setClosedCategories, (categoryId) =>
    closedCategories.has(categoryId)
  );

  const handleOpenRoom: MouseEventHandler<HTMLButtonElement> = (evt) => {
    const rId = evt.currentTarget.getAttribute('data-room-id');
    if (!rId) return;
    const pSpaceIdOrAlias = getCanonicalAliasOrRoomId(mx, space.roomId);
    navigate(getSpaceRoomPath(pSpaceIdOrAlias, getCanonicalAliasOrRoomId(mx, rId)));
  };

  const togglePinToSidebar = useCallback(
    (rId: string) => {
      const newItems = sidebarItemWithout(sidebarItems, rId);
      if (!sidebarSpaces.has(rId)) {
        newItems.push(rId);
      }
      const newSpacesContent = makeCinnySpacesContent(mx, newItems);
      mx.setAccountData(AccountDataEvent.CinnySpaces, newSpacesContent);
    },
    [mx, sidebarItems, sidebarSpaces]
  );

  return (
    <PowerLevelsContextProvider value={spacePowerLevels}>
      <Box grow="Yes">
        <Page>
          <LobbyHeader
            showProfile={!onTop}
            powerLevels={roomsPowerLevels.get(space.roomId) ?? {}}
          />
          <Box style={{ position: 'relative' }} grow="Yes">
            <Scroll ref={scrollRef} hideTrack visibility="Hover">
              <PageContent>
                <PageContentCenter>
                  <ScrollTopContainer
                    scrollRef={scrollRef}
                    anchorRef={heroSectionRef}
                    onVisibilityChange={setOnTop}
                  >
                    <IconButton
                      onClick={() => virtualizer.scrollToOffset(0)}
                      variant="SurfaceVariant"
                      radii="Pill"
                      outlined
                      size="300"
                      aria-label="Scroll to Top"
                    >
                      <Icon src={Icons.ChevronTop} size="300" />
                    </IconButton>
                  </ScrollTopContainer>
                  <div
                    style={{
                      position: 'relative',
                      height: virtualizer.getTotalSize(),
                    }}
                  >
                    <PageHeroSection ref={heroSectionRef} style={{ paddingTop: 0 }}>
                      <LobbyHero />
                    </PageHeroSection>
                    {vItems.map((vItem) => {
                      const item = hierarchy[vItem.index];
                      if (!item) return null;
                      const nextSpaceId = hierarchy[vItem.index + 1]?.space.roomId;

                      const categoryId = makeLobbyCategoryId(space.roomId, item.space.roomId);

                      return (
                        <VirtualTile
                          virtualItem={vItem}
                          style={{
                            paddingTop: vItem.index === 0 ? 0 : config.space.S500,
                          }}
                          ref={virtualizer.measureElement}
                          key={vItem.index}
                        >
                          <SpaceHierarchy
                            spaceItem={item.space}
                            summary={spacesItems.get(item.space.roomId)}
                            roomItems={item.rooms}
                            allJoinedRooms={allJoinedRooms}
                            mDirects={mDirects}
                            roomsPowerLevels={roomsPowerLevels}
                            canEditSpaceChild={canEditSpaceChild}
                            categoryId={categoryId}
                            closed={
                              closedCategories.has(categoryId) ||
                              (draggingItem ? 'space' in draggingItem : false)
                            }
                            handleClose={handleCategoryClick}
                            draggingItem={draggingItem}
                            onDragging={setDraggingItem}
                            canDrop={canDrop}
                            nextSpaceId={nextSpaceId}
                            getRoom={getRoom}
                            pinned={sidebarSpaces.has(item.space.roomId)}
                            togglePinToSidebar={togglePinToSidebar}
                            onSpacesFound={handleSpacesFound}
                            onOpenRoom={handleOpenRoom}
                          />
                        </VirtualTile>
                      );
                    })}
                  </div>
                </PageContentCenter>
              </PageContent>
            </Scroll>
          </Box>
        </Page>
        {screenSize === ScreenSize.Desktop && isDrawer && (
          <>
            <Line variant="Background" direction="Vertical" size="300" />
            <MembersDrawer room={space} members={members} />
          </>
        )}
      </Box>
    </PowerLevelsContextProvider>
  );
}
