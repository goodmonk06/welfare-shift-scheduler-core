# Phase 3 Overview

## Purpose Statement

`welfare-shift-scheduler-core` is a domain-specific scheduling engine for Japanese healthcare facilities (介護施設). It solves the complex problem of generating monthly shift schedules while respecting labor regulations, employee preferences, skill requirements, and facility staffing needs. Unlike generic scheduling tools, this system understands the unique constraints of Japanese elderly care: specialized shift types (early/day/late/night patterns), night shift limitations, consecutive work day rules, and the nuanced balance between mandatory constraints and optimization goals.

This repository serves as a **reusable scheduling brain** that can be integrated into larger facility management systems, HR platforms, or standalone shift management applications. It provides both a programmatic API (library) and a REST API (service) for maximum flexibility.

## Current Features (Post-Phase 2)

### Domain Model
- ✅ **Employee**: Full-time and part-time staff with skills, preferences, and constraints
- ✅ **ShiftType**: 7 standard Japanese healthcare shift patterns (early, day A/B, late, night start/end, off)
- ✅ **Schedule**: Monthly shift assignments with metadata
- ✅ **Constraints**: 6 hard constraints + 5 soft constraints
- ✅ **Role**: 8 healthcare job types (care worker, nurse, therapist, etc.)
- ✅ **Skill**: 8 skill categories (care, medical, night shift capable, etc.)

### API & Integration
- ✅ REST API with Express.js
- ✅ CRUD operations for employees
- ✅ Schedule generation and retrieval endpoints
- ✅ Zod validation for all inputs
- ✅ Centralized error handling
- ✅ Health check endpoint

### DX & Infrastructure
- ✅ In-memory storage (ready for DB migration)
- ✅ Vitest test suite (domain, constraints, solver)
- ✅ Docker + docker-compose setup
- ✅ Seed data (6 sample employees)
- ✅ Comprehensive README

### Solver
- ✅ NaiveSolver: Heuristic-based schedule generation
- ✅ Constraint evaluation framework
- ✅ Satisfiability scoring (0-100)

## Current Limitations

1. **Single Facility**: Cannot manage multiple facilities
2. **No History**: No audit trail or schedule versioning
3. **Static Shifts**: Cannot create custom shift templates
4. **No Collaboration**: No shift swap/trade mechanism
5. **Limited Observability**: No logging, metrics, or events
6. **No Integrations**: No adapter system for external services
7. **Basic Solver**: Only heuristic solver, no OR-Tools integration
8. **In-Memory Only**: No persistent database
9. **No Analytics**: No reporting or trend analysis
10. **No Configuration**: Facility-level settings hardcoded

## Phase 3 Plan

### 1. Domain Deepening (New Entities & Relationships)
- **Facility**: Multi-facility support with facility-specific settings
- **ShiftTemplate**: Reusable custom shift patterns per facility
- **ShiftSwapRequest**: Employee-initiated shift trade workflow
- **ScheduleHistory**: Version history and change tracking
- **FacilityConfiguration**: Per-facility rules and preferences

### 2. Multiple Vertical Slices (2-3 Complete Flows)
- **Facility Management Flow**: Create facility → configure settings → assign employees → generate schedules
- **Shift Swap Flow**: Employee requests swap → manager reviews → approval/rejection → schedule update
- **Analytics Flow**: Generate schedule → view metrics → export reports

### 3. Extensibility & Integration Points
- **Notification Adapter**: Abstract interface for email/SMS/push notifications
- **Metrics Adapter**: Pluggable metrics collection (Prometheus, Datadog, etc.)
- **Storage Adapter**: Abstract persistence layer (in-memory, PostgreSQL, etc.)
- **Event System**: Domain events for schedule changes, approvals, violations
- **Export Adapter**: PDF, Excel, CSV export capabilities

### 4. Infrastructure & DX Enhancements
- **CLI Tool**: Command-line utility for maintenance tasks
- **Advanced Logging**: Structured logging with context
- **Metrics Collection**: Performance and usage tracking
- **Test Fixtures**: Rich test data factories
- **Migration Scripts**: Database migration support

### 5. Quality & Robustness
- **Integration Tests**: End-to-end API tests
- **Scenario Tests**: Complex multi-entity workflows
- **Error Taxonomy**: Detailed error codes and messages
- **Input Validation**: Comprehensive validation rules
- **Rate Limiting**: API protection (future)

### 6. Documentation & Productization
- **Architecture Guide**: System design and component interaction
- **Domain Guide**: Deep dive into healthcare scheduling concepts
- **Integration Recipes**: How to combine with auth, notifications, etc.
- **API Documentation**: Complete endpoint reference
- **Deployment Guide**: Production deployment patterns

## Success Criteria for Phase 3

- ✅ 5+ new domain entities implemented
- ✅ 3+ vertical slices fully working
- ✅ Plugin system with 3+ adapter types
- ✅ Event system with typed domain events
- ✅ 20+ integration/scenario tests
- ✅ Rich seed data (multiple facilities, 20+ employees, realistic schedules)
- ✅ CLI tool with 5+ commands
- ✅ Structured logging and metrics
- ✅ 5+ documentation files
- ✅ Codebase 5-10x larger (in a good way)

## Timeline

Phase 3 is being implemented immediately following Phase 2 completion. All features will be implemented incrementally with backwards compatibility maintained.
