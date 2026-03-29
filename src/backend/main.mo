import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import Runtime "mo:core/Runtime";

actor {
  // Components
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Furniture Management
  type FurnitureItem = {
    id : Text;
    name : Text;
    category : Text;
    description : Text;
    image : Storage.ExternalBlob;
  };

  module FurnitureItem {
    public func compareByCategory(f1 : FurnitureItem, f2 : FurnitureItem) : Order.Order {
      Text.compare(f1.category, f2.category);
    };
  };

  let furniture = Map.empty<Text, FurnitureItem>();

  public shared ({ caller }) func createFurnitureItem(id : Text, name : Text, category : Text, description : Text, image : Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can create furniture items");
    };

    if (furniture.containsKey(id)) {
      Runtime.trap("Furniture item with this ID already exists");
    };

    let item : FurnitureItem = {
      id;
      name;
      category;
      description;
      image;
    };

    furniture.add(id, item);
  };

  public shared ({ caller }) func updateFurnitureItem(id : Text, name : Text, category : Text, description : Text, image : Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update furniture items");
    };

    switch (furniture.get(id)) {
      case (null) { Runtime.trap("Furniture item not found") };
      case (?_) {
        furniture.add(
          id,
          {
            id;
            name;
            category;
            description;
            image;
          },
        );
      };
    };
  };

  public shared ({ caller }) func deleteFurnitureItem(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete furniture items");
    };

    switch (furniture.get(id)) {
      case (null) { Runtime.trap("Furniture item not found") };
      case (?_) {
        furniture.remove(id);
      };
    };
  };

  public query func getAllFurnitureItems() : async [FurnitureItem] {
    furniture.values().toArray();
  };

  public query func getFurnitureItem(id : Text) : async ?FurnitureItem {
    furniture.get(id);
  };

  public query func getUniqueCategories() : async [Text] {
    let categories = Set.empty<Text>();

    for (item in furniture.values()) {
      categories.add(item.category);
    };

    categories.values().toArray();
  };

  // ── Attendance System ──────────────────────────────────────────────────────

  // V1 type kept for stable-variable migration (must match old stored shape exactly)
  type EmployeeV1 = {
    id : Text;
    name : Text;
    department : Text;
    phone : Text;
  };

  // New type with optional photo
  public type Employee = {
    id : Text;
    name : Text;
    department : Text;
    phone : Text;
    image : ?Storage.ExternalBlob;
  };

  public type AttendanceStatus = { #present; #absent; #late };

  public type AttendanceRecord = {
    id : Text;
    employeeId : Text;
    date : Text;
    checkIn : Text;
    checkOut : Text;
    status : AttendanceStatus;
  };

  // Stable map holding old V1 records — keeps existing data intact on upgrade.
  // New records written to employeesV2; migration runs once in postupgrade.
  let employees = Map.empty<Text, EmployeeV1>();
  let employeesV2 = Map.empty<Text, Employee>();
  stable var employeesV2Initialized : Bool = false;

  system func postupgrade() {
    if (not employeesV2Initialized) {
      for (emp in employees.values()) {
        employeesV2.add(
          emp.id,
          {
            id = emp.id;
            name = emp.name;
            department = emp.department;
            phone = emp.phone;
            image = null;
          },
        );
      };
      employeesV2Initialized := true;
    };
  };

  let attendance = Map.empty<Text, AttendanceRecord>();

  // Employee CRUD (admin-only) — all operations use employeesV2
  public shared ({ caller }) func addEmployee(id : Text, name : Text, department : Text, phone : Text, image : ?Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can add employees");
    };
    if (employeesV2.containsKey(id)) {
      Runtime.trap("Employee with this ID already exists");
    };
    employeesV2.add(id, { id; name; department; phone; image });
  };

  public shared ({ caller }) func updateEmployee(id : Text, name : Text, department : Text, phone : Text, image : ?Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update employees");
    };
    switch (employeesV2.get(id)) {
      case (null) { Runtime.trap("Employee not found") };
      case (?_) { employeesV2.add(id, { id; name; department; phone; image }) };
    };
  };

  public shared ({ caller }) func deleteEmployee(id : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete employees");
    };
    switch (employeesV2.get(id)) {
      case (null) { Runtime.trap("Employee not found") };
      case (?_) { employeesV2.remove(id) };
    };
  };

  public query func getAllEmployees() : async [Employee] {
    employeesV2.values().toArray();
  };

  // Attendance CRUD (admin-only writes, public reads)
  public shared ({ caller }) func markAttendance(employeeId : Text, date : Text, checkIn : Text, checkOut : Text, status : AttendanceStatus) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can mark attendance");
    };
    let id = employeeId # "_" # date;
    attendance.add(id, { id; employeeId; date; checkIn; checkOut; status });
  };

  public shared ({ caller }) func updateAttendance(employeeId : Text, date : Text, checkIn : Text, checkOut : Text, status : AttendanceStatus) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can update attendance");
    };
    let id = employeeId # "_" # date;
    attendance.add(id, { id; employeeId; date; checkIn; checkOut; status });
  };

  public shared ({ caller }) func deleteAttendance(employeeId : Text, date : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can delete attendance");
    };
    let id = employeeId # "_" # date;
    attendance.remove(id);
  };

  public query func getAttendanceByDate(date : Text) : async [AttendanceRecord] {
    attendance.values().toArray().filter(func(r : AttendanceRecord) : Bool { r.date == date });
  };

  public query func getAttendanceByEmployee(employeeId : Text) : async [AttendanceRecord] {
    attendance.values().toArray().filter(func(r : AttendanceRecord) : Bool { r.employeeId == employeeId });
  };
};
