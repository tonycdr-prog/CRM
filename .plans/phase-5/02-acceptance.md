# Acceptance Criteria

- Schema includes meters, calibrations, and readings tables with migration applied.
- API supports creating meters, calibrations, listing active meters, and recording readings with meter + engineer linkage.
- Calibration validity enforced with configurable warn/block semantics at save and submit.
- Runner UI surfaces meter selection, calibration expiry, and inline warnings.
- Tests cover reading persistence, expired calibration handling, and valid calibration success.
