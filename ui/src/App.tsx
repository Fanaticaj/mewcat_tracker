import { Container, Stack } from "@mui/material";
import { DropZoneSection } from "./features/planner/components/DropZoneSection";
import { PlannerHeader } from "./features/planner/components/PlannerHeader";
import { usePlannerState } from "./features/planner/hooks/usePlannerState";
import { averageStatSum } from "./features/planner/utils";

export default function App() {
  const {
    activeDropZone,
    addRoom,
    assignedCount,
    autoAssignEligibleCats,
    cats,
    clearAllRooms,
    decodeSavFile,
    dragState,
    eligibleUnassignedCount,
    exportRoomFile,
    filteredCats,
    genderFilter,
    statusFilter,
    handleDragEnd,
    handleDragLeave,
    handleDragOver,
    handleDragStart,
    handleDrop,
    importCsv,
    importRoomFile,
    isDecodingSav,
    moveCatToRoom,
    newRoomName,
    plannerMessage,
    plannerMessageTone,
    removeRoom,
    renameRoom,
    resetStatFilters,
    roomNames,
    search,
    setGenderFilter,
    setStatusFilter,
    setNewRoomName,
    setSearch,
    setSortDirection,
    setSortField,
    sortDirection,
    sortField,
    statFilters,
    statusOptions,
    toggleCatEligibility,
    tokenKinds,
    totalValidCats,
    unassigned,
    updateStatFilter,
    visibleRoomCats,
    wasCatMarkedEligible,
  } = usePlannerState();

  return (
    <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <PlannerHeader
          assignedCount={assignedCount}
          eligibleUnassignedCount={eligibleUnassignedCount}
          filteredCount={filteredCats.length}
          genderFilter={genderFilter}
          isDecodingSav={isDecodingSav}
          newRoomName={newRoomName}
          onAddRoom={addRoom}
          onAutoAssignEligibleCats={autoAssignEligibleCats}
          onClearAllRooms={clearAllRooms}
          onDecodeSavFile={decodeSavFile}
          onExportRoomFile={exportRoomFile}
          onGenderFilterChange={setGenderFilter}
          onImportCsv={importCsv}
          onImportRoomFile={importRoomFile}
          onNewRoomNameChange={setNewRoomName}
          onResetStatFilters={resetStatFilters}
          onSearchChange={setSearch}
          onSortDirectionChange={setSortDirection}
          onSortFieldChange={setSortField}
          onStatusFilterChange={setStatusFilter}
          onStatFilterChange={updateStatFilter}
          plannerMessage={plannerMessage}
          plannerMessageTone={plannerMessageTone}
          roomCount={roomNames.length}
          search={search}
          sortDirection={sortDirection}
          sortField={sortField}
          statFilters={statFilters}
          statusFilter={statusFilter}
          statusOptions={statusOptions}
          tokenKinds={tokenKinds}
          totalValidCats={totalValidCats}
        />

        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          alignItems="flex-start"
        >
          <DropZoneSection
            title="Unassigned Cats"
            subtitle="Start here, then drag cats into rooms."
            count={unassigned.length}
            averageLabel={`${filteredCats.length - unassigned.length} assigned in view`}
            cats={unassigned}
            roomNames={roomNames}
            getRoomForCat={() => "unassigned"}
            onMove={moveCatToRoom}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            dropId="unassigned"
            isActiveDropZone={activeDropZone === "unassigned"}
            draggingCatKey={dragState?.catKey ?? null}
            emptyMessage={
              cats.length === 0
                ? "Import a CSV to start building your room plan."
                : "No unassigned cats match the current filters."
            }
            isCatEligibleForAutoAssign={wasCatMarkedEligible}
            sx={{ flex: 1.15, minWidth: 0, width: "100%" }}
            onToggleEligibility={toggleCatEligibility}
          />

          <Stack spacing={2} sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            {roomNames.map((roomName) => (
              <DropZoneSection
                key={roomName}
                title={roomName}
                subtitle="Drop cats here to assign the room."
                count={visibleRoomCats[roomName].length}
                averageLabel={`Avg total stats ${averageStatSum(
                  visibleRoomCats[roomName],
                )}`}
                cats={visibleRoomCats[roomName]}
                roomNames={roomNames}
                getRoomForCat={() => roomName}
                onMove={moveCatToRoom}
                onRemoveRoom={removeRoom}
                onRenameRoom={renameRoom}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                isCatEligibleForAutoAssign={wasCatMarkedEligible}
                dropId={roomName}
                isActiveDropZone={activeDropZone === roomName}
                draggingCatKey={dragState?.catKey ?? null}
                emptyMessage="No cats in this room yet."
                onToggleEligibility={toggleCatEligibility}
              />
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Container>
  );
}
