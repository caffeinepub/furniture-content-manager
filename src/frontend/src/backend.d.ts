import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface FurnitureItem {
    id: string;
    name: string;
    description: string;
    category: string;
    image: ExternalBlob;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface Employee {
    id: string;
    name: string;
    department: string;
    phone: string;
    image: ExternalBlob | null;
}
export type AttendanceStatus = { __kind__: "present" } | { __kind__: "absent" } | { __kind__: "late" };
export interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string;
    checkIn: string;
    checkOut: string;
    status: AttendanceStatus;
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createFurnitureItem(id: string, name: string, category: string, description: string, image: ExternalBlob): Promise<void>;
    deleteFurnitureItem(id: string): Promise<void>;
    getAllFurnitureItems(): Promise<Array<FurnitureItem>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFurnitureItem(id: string): Promise<FurnitureItem | null>;
    getUniqueCategories(): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateFurnitureItem(id: string, name: string, category: string, description: string, image: ExternalBlob): Promise<void>;
    // Attendance
    addEmployee(id: string, name: string, department: string, phone: string, image: ExternalBlob | null): Promise<void>;
    updateEmployee(id: string, name: string, department: string, phone: string, image: ExternalBlob | null): Promise<void>;
    deleteEmployee(id: string): Promise<void>;
    getAllEmployees(): Promise<Array<Employee>>;
    markAttendance(employeeId: string, date: string, checkIn: string, checkOut: string, status: AttendanceStatus): Promise<void>;
    updateAttendance(employeeId: string, date: string, checkIn: string, checkOut: string, status: AttendanceStatus): Promise<void>;
    deleteAttendance(employeeId: string, date: string): Promise<void>;
    getAttendanceByDate(date: string): Promise<Array<AttendanceRecord>>;
    getAttendanceByEmployee(employeeId: string): Promise<Array<AttendanceRecord>>;
}
