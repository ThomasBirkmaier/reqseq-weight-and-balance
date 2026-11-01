//! Acceptance tests of the calculation core. Test names follow `sr_<short id>_ak<n>_<what>`;
//! CI maps them to `[SR-<short id>/AK<n>]` before ReqSeq enriches the JUnit report.

use wb_core::calc::{evaluate, moment_tenths, CgState, INCOMPLETE, OUT_CG, OUT_MASS, WITHIN};
use wb_core::fleet::{parse_fleet, Aircraft, FLEET_CSV, TYPES};

fn ac(id: &str) -> Aircraft {
    parse_fleet(FLEET_CSV).unwrap().into_iter().find(|a| a.id == id).unwrap()
}

fn ev(id: &str, t: &[&str]) -> wb_core::calc::Evaluation {
    evaluate(&ac(id), t)
}

// SR-348143 Total mass
#[test]
fn sr_348143_ak1_total_mass_945_kg() {
    assert_eq!(ev("HC4-01", &["160", "0", "20"]).total_kg, 945);
}
#[test]
fn sr_348143_ak2_total_mass_empty_aircraft_765_kg() {
    assert_eq!(ev("HC4-01", &["0", "0", "0"]).total_kg, 765);
}

// SR-29562e Centre of gravity
#[test]
fn sr_29562e_ak1_cg_2_219_m() {
    assert_eq!(ev("HC4-01", &["160", "0", "20"]).cg_mm_rounded(), 2219);
}
#[test]
fn sr_29562e_ak2_cg_2_475_m() {
    assert_eq!(ev("HC4-01", &["70", "200", "50"]).cg_mm_rounded(), 2475);
}

// SR-45198e Mass above the maximum take-off mass
#[test]
fn sr_45198e_ak1_mass_1155_kg_outside() {
    let e = ev("HC4-01", &["180", "160", "50"]);
    assert_eq!(e.total_kg, 1155);
    assert!(e.indications.contains(&OUT_MASS));
    assert!(!e.indications.contains(&WITHIN));
}
#[test]
fn sr_45198e_ak2_mass_exactly_1150_kg_not_outside() {
    let e = ev("HC4-01", &["180", "160", "45"]);
    assert_eq!(e.total_kg, 1150);
    assert!(!e.indications.contains(&OUT_MASS));
}

// SR-687e88 Centre of gravity outside the envelope
#[test]
fn sr_687e88_ak1_aft_limit_exceeded() {
    let e = ev("HC4-01", &["70", "200", "50"]);
    assert_eq!(e.cg_state, CgState::Aft);
    assert_eq!(e.indications, vec![OUT_CG]);
}
#[test]
fn sr_687e88_ak2_forward_limit_exceeded() {
    let e = ev("HC4-01", &["212", "6", "8"]);
    assert_eq!((e.total_kg, e.cg_mm_rounded()), (991, 2193));
    assert_eq!(e.cg_state, CgState::Forward);
    assert_eq!(e.indications, vec![OUT_CG]);
}
#[test]
fn sr_687e88_ak3_exactly_on_forward_limit_not_outside() {
    let e = ev("HC4-01", &["211", "6", "8"]);
    assert_eq!(e.total_kg, 990);
    assert_eq!(e.cg_state, CgState::Within);
    assert!(!e.indications.contains(&OUT_CG));
}

// SR-3a4905 Within limits
#[test]
fn sr_3a4905_ak1_within_limits_945_kg() {
    assert_eq!(ev("HC4-01", &["160", "0", "20"]).indications, vec![WITHIN]);
}
#[test]
fn sr_3a4905_ak2_within_limits_exactly_mtom() {
    assert_eq!(ev("HC4-01", &["180", "160", "45"]).indications, vec![WITHIN]);
}
#[test]
fn sr_3a4905_ak3_within_limits_exactly_on_aft_limit() {
    let e = ev("HC4-01", &["73", "200", "47"]);
    assert_eq!(e.total_kg, 1085);
    assert_eq!(e.cg_num, 2470 * 1085);
    assert_eq!(e.indications, vec![WITHIN]);
}

// SR-181ae8 Message for an invalid mass entry
#[test]
fn sr_181ae8_ak1_rear_seats_201_kg_message() {
    let e = ev("HC4-01", &["", "201", ""]);
    assert_eq!(e.entries[1].message.as_deref(), Some("Enter 0 to 200 kg"));
}
#[test]
fn sr_181ae8_ak2_front_seats_negative_message() {
    let e = ev("HC4-01", &["-5", "", ""]);
    assert_eq!(e.entries[0].message.as_deref(), Some("Enter 0 to 230 kg"));
}
#[test]
fn sr_181ae8_ak3_baggage_decimal_message() {
    let e = ev("HC4-01", &["", "", "7.5"]);
    assert_eq!(e.entries[2].message.as_deref(), Some("Enter 0 to 50 kg"));
    let t = ev("HC4-01", &["", "", "abc"]);
    assert_eq!(t.entries[2].message.as_deref(), Some("Enter 0 to 50 kg"));
}

// SR-b59c9a Check not complete
#[test]
fn sr_b59c9a_ak1_invalid_entry_check_not_complete() {
    let e = ev("HC4-01", &["160", "201", "0"]);
    assert_eq!(e.indications, vec![INCOMPLETE]);
    assert!(!e.within());
}
#[test]
fn sr_b59c9a_ak2_empty_entry_check_not_complete() {
    let e = ev("HC4-01", &["160", "0", ""]);
    assert_eq!(e.indications, vec![INCOMPLETE]);
    assert!(!e.within());
}
#[test]
fn sr_b59c9a_ak3_corrected_entry_gives_indication() {
    let e = ev("HC4-01", &["160", "200", "0"]);
    assert_ne!(e.indications, vec![INCOMPLETE]);
}

// SR-bdab78 Data of the Halcyra HC-4
#[test]
fn sr_bdab78_ak1_hc4_01_empty() {
    let e = ev("HC4-01", &["0", "0", "0"]);
    assert_eq!((e.total_kg, e.cg_mm_rounded()), (765, 2220));
}
#[test]
fn sr_bdab78_ak2_hc4_02_empty() {
    let e = ev("HC4-02", &["0", "0", "0"]);
    assert_eq!((e.total_kg, e.cg_mm_rounded()), (778, 2236));
}
#[test]
fn sr_bdab78_ak3_hc4_mtom_1150_kg() {
    assert_eq!(TYPES[ac("HC4-01").type_index].mtom_kg, 1150);
}

// SR-d0fb6e Data of the Halcyra HC-2 (variant)
#[test]
fn sr_d0fb6e_ak1_hc2_01_empty() {
    let e = ev("HC2-01", &["0", "0"]);
    assert_eq!((e.total_kg, e.cg_mm_rounded()), (640, 2150));
}
#[test]
fn sr_d0fb6e_ak2_hc2_stations() {
    let t = &TYPES[ac("HC2-01").type_index];
    let s: Vec<(&str, i64)> = t.stations.iter().map(|s| (s.name, s.max_kg)).collect();
    assert_eq!(s, vec![("Front seats", 220), ("Baggage compartment", 40)]);
}
#[test]
fn sr_d0fb6e_ak3_hc2_aft_limit_exceeded() {
    let e = ev("HC2-01", &["60", "40"]);
    assert_eq!((e.total_kg, e.cg_mm_rounded()), (740, 2178));
    assert_eq!(e.indications, vec![OUT_CG]);
}

// SR-663a61 Aircraft data from the fleet data file
#[test]
fn sr_663a61_ak2_changed_fleet_file_changes_total_mass() {
    let csv = FLEET_CSV.replace("HC4-02,hc4,778,", "HC4-02,hc4,781,");
    let a = parse_fleet(&csv).unwrap().into_iter().find(|a| a.id == "HC4-02").unwrap();
    assert_eq!(evaluate(&a, &["0", "0", "0"]).total_kg, 781);
}

// SR-0b76d9 Loading table with moments
#[test]
fn sr_0b76d9_ak1_table_rows() {
    let e = ev("HC4-01", &["160", "0", "20"]);
    let rows: Vec<(String, i64, i64, i64)> =
        e.rows.iter().map(|r| (r.name.clone(), r.kg, r.arm_mm, moment_tenths(r.moment_kgmm))).collect();
    assert_eq!(
        rows,
        vec![
            ("Empty mass".into(), 765, 2220, 16983),
            ("Front seats".into(), 160, 2000, 3200),
            ("Rear seats".into(), 0, 3250, 0),
            ("Baggage compartment".into(), 20, 3950, 790),
        ]
    );
    assert_eq!((e.total_kg, e.cg_mm_rounded(), moment_tenths(e.moment_kgmm)), (945, 2219, 20973));
}

// Limit check rule (decision): both indications when mass and centre of gravity are exceeded.
#[test]
fn limit_rule_both_limits_mass_first() {
    // Synthetic aircraft with a far aft empty mass: no real loading of the fleet exceeds both.
    let a = Aircraft { id: "T".into(), type_index: 0, empty_kg: 1100, empty_arm_mm: 2600, weighing_date: "-".into() };
    let e = evaluate(&a, &["100", "0", "0"]);
    assert_eq!(e.indications, vec![OUT_MASS, OUT_CG]);
}

#[test]
fn limit_rule_hc2_forward_and_mass() {
    assert_eq!(ev("HC2-01", &["220", "0"]).cg_state, CgState::Forward);
    let e = ev("HC2-01", &["220", "40"]);
    assert_eq!(e.indications, vec![OUT_MASS]);
}

#[test]
fn fleet_file_parses() {
    assert_eq!(parse_fleet(FLEET_CSV).unwrap().len(), 3);
}

#[test]
fn json_interface_round_trip() {
    let j = wb_core::evaluate_json("HC4-01\n160\n0\n20");
    assert!(j.contains("\"totalKg\":945"));
    assert!(j.contains("\"cgMm\":2219"));
    assert!(j.contains("Within limits (without fuel)"));
    let f = wb_core::fleet_json("hc2");
    assert!(f.contains("HC2-01") && !f.contains("HC4-01"));
}
