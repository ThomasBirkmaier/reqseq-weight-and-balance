//! Acceptance tests of the calculation core. Test names follow `sr_<short id>_ak_<criterion key>_<what>`;
//! CI enriches the JUnit report with `--name-pattern '{prefix}_{id}_ak_{ak}'` for the core and the
//! HC-2 view, so every test names exactly one acceptance criterion. More tests: `release3.rs`.
#![expect(
    clippy::unwrap_used,
    clippy::indexing_slicing,
    reason = "test helpers fail the test loudly on broken data; the lints stay on for the core"
)]

use wb_core::calc::{
    CgState, Evaluation, FUEL_ROW, INCOMPLETE, OUT_CG, OUT_MASS, WITHIN, evaluate, kg_rounded, moment_tenths,
};
use wb_core::fleet::{Aircraft, FLEET_CSV, TYPES, parse_fleet};
use wb_core::fuel::{FUEL_JSON, FuelData, fuel_data, parse_fuel};

fn ac(id: &str) -> Aircraft {
    parse_fleet(FLEET_CSV)
        .unwrap()
        .into_iter()
        .find(|a| a.id == id)
        .unwrap()
}
fn fd() -> FuelData {
    fuel_data().unwrap()
}
fn ev_with(fuel: &FuelData, id: &str, t: &[&str], fuel_l: &str, burn: &str) -> Evaluation {
    let a = ac(id);
    let key = TYPES[a.type_index].key;
    evaluate(&a, &fuel.types[key], fuel.density_g_per_l, t, fuel_l, burn)
}
/// Loading with fuel and burn.
fn evf(id: &str, t: &[&str], fuel_l: &str, burn: &str) -> Evaluation {
    ev_with(&fd(), id, t, fuel_l, burn)
}
/// Loading with 0 L usable fuel at take-off and 0 L planned fuel burn.
fn ev(id: &str, t: &[&str]) -> Evaluation {
    evf(id, t, "0", "0")
}

// SR-348143 Total mass
#[test]
fn sr_348143_ak_jk10_total_mass_with_fuel_1017_kg() {
    assert_eq!(
        evf("HC4-01", &["160", "0", "20"], "100", "60").take_off.total_kg(),
        1017
    );
}
#[test]
fn sr_348143_ak_yc6g_total_mass_empty_aircraft_765_kg() {
    assert_eq!(ev("HC4-01", &["0", "0", "0"]).take_off.total_kg(), 765);
}

#[test]
fn sr_348143_ak_vf0q_landing_mass_974_kg() {
    assert_eq!(evf("HC4-01", &["160", "0", "20"], "100", "60").landing.total_kg(), 974);
}

// SR-29562e Centre of gravity
#[test]
fn sr_29562e_ak_vbf5_cg_with_fuel_2_229_m() {
    assert_eq!(
        evf("HC4-01", &["160", "0", "20"], "100", "60").take_off.cg_mm_rounded(),
        2229
    );
}
#[test]
fn sr_29562e_ak_ts69_cg_2_475_m() {
    assert_eq!(ev("HC4-01", &["70", "200", "50"]).take_off.cg_mm_rounded(), 2475);
}

#[test]
fn sr_29562e_ak_ssg7_cg_at_landing_2_223_m() {
    assert_eq!(
        evf("HC4-01", &["160", "0", "20"], "100", "60").landing.cg_mm_rounded(),
        2223
    );
}

// SR-45198e Mass above the maximum take-off mass
#[test]
fn sr_45198e_ak_k8g5_mass_1155_kg_outside() {
    let e = ev("HC4-01", &["180", "160", "50"]).take_off;
    assert_eq!(e.total_kg(), 1155);
    assert!(e.indications.contains(&OUT_MASS));
    assert!(!e.indications.contains(&WITHIN));
}
#[test]
fn sr_45198e_ak_j58j_mass_1154_8_kg_with_fuel_outside() {
    let e = evf("HC4-01", &["180", "100", "45"], "90", "0").take_off;
    assert_eq!(e.total_g, 1_154_800);
    assert!(e.indications.contains(&OUT_MASS));
}

#[test]
fn sr_45198e_ak_yk0x_mass_and_cg_both_shown_mass_first() {
    let e = evf("HC4-01", &["230", "100", "0"], "100", "0").take_off;
    assert_eq!((e.total_kg(), e.cg_mm_rounded()), (1167, 2273));
    assert_eq!(e.indications, vec![OUT_MASS, OUT_CG]);
}

// SR-687e88 Centre of gravity outside the envelope
#[test]
fn sr_687e88_ak_xnpm_aft_limit_exceeded() {
    let e = ev("HC4-01", &["70", "200", "50"]).take_off;
    assert_eq!(e.cg_state, CgState::Aft);
    assert_eq!(e.indications, vec![OUT_CG]);
}
#[test]
fn sr_687e88_ak_z893_forward_limit_exceeded() {
    let e = ev("HC4-01", &["212", "6", "8"]).take_off;
    assert_eq!((e.total_kg(), e.cg_mm_rounded()), (991, 2193));
    assert_eq!(e.cg_state, CgState::Forward);
    assert_eq!(e.indications, vec![OUT_CG]);
}
#[test]
fn sr_687e88_ak_gf0r_exactly_on_forward_limit_not_outside() {
    let e = ev("HC4-01", &["211", "6", "8"]).take_off;
    assert_eq!(e.total_kg(), 990);
    assert_eq!(e.cg_state, CgState::Within);
    assert!(!e.indications.contains(&OUT_CG));
}

// SR-3a4905 Within limits
#[test]
fn sr_3a4905_ak_y54c_within_limits_with_fuel() {
    assert_eq!(
        evf("HC4-01", &["160", "0", "20"], "100", "60").take_off.indications,
        vec![WITHIN]
    );
}
#[test]
fn sr_3a4905_ak_gt5z_within_limits_exactly_mtom() {
    let e = ev("HC4-01", &["180", "160", "45"]).take_off;
    assert_eq!(e.total_g, 1_150_000);
    assert_eq!(e.indications, vec![WITHIN]);
}
#[test]
fn sr_3a4905_ak_svpd_within_limits_exactly_on_aft_limit() {
    let e = ev("HC4-01", &["73", "200", "47"]).take_off;
    assert_eq!((e.total_kg(), e.cg_mm_rounded()), (1085, 2470));
    assert_eq!(e.indications, vec![WITHIN]);
}

// SR-181ae8 Message for an invalid mass entry
#[test]
fn sr_181ae8_ak_j1jc_rear_seats_201_kg_message() {
    assert_eq!(
        ev("HC4-01", &["0", "201", "0"]).entries[1].message.as_deref(),
        Some("Enter 0 to 200 kg")
    );
}
#[test]
fn sr_181ae8_ak_bb4d_front_seats_negative_message() {
    assert_eq!(
        ev("HC4-01", &["-5", "0", "0"]).entries[0].message.as_deref(),
        Some("Enter 0 to 230 kg")
    );
}
#[test]
fn sr_181ae8_ak_w4j4_baggage_decimal_message() {
    assert_eq!(
        ev("HC4-01", &["0", "0", "7.5"]).entries[2].message.as_deref(),
        Some("Enter 0 to 50 kg")
    );
}

// SR-b59c9a Check not complete
#[test]
fn sr_b59c9a_ak_jgk2_invalid_entry_check_not_complete_at_take_off_and_landing() {
    let e = ev("HC4-01", &["160", "201", "0"]);
    assert!(!e.complete);
    assert_eq!(e.take_off.indications, vec![INCOMPLETE]);
    assert_eq!(e.landing.indications, vec![INCOMPLETE]);
}
#[test]
fn sr_b59c9a_ak_k0w1_empty_fuel_entry_check_not_complete() {
    let e = evf("HC4-01", &["160", "0", "0"], "", "0");
    assert_eq!(e.take_off.indications, vec![INCOMPLETE]);
}
#[test]
fn sr_b59c9a_ak_qp17_corrected_entry_gives_indication() {
    let e = ev("HC4-01", &["160", "200", "0"]);
    assert!(e.complete);
    assert_ne!(e.take_off.indications, vec![INCOMPLETE]);
}

// SR-bdab78 Data of the Halcyra HC-4
#[test]
fn sr_bdab78_ak_r318_hc4_01_empty() {
    let e = ev("HC4-01", &["0", "0", "0"]).take_off;
    assert_eq!((e.total_kg(), e.cg_mm_rounded()), (765, 2220));
}
#[test]
fn sr_bdab78_ak_d3h0_hc4_02_empty() {
    let e = ev("HC4-02", &["0", "0", "0"]).take_off;
    assert_eq!((e.total_kg(), e.cg_mm_rounded()), (778, 2236));
}

// SR-d0fb6e Data of the Halcyra HC-2
#[test]
fn sr_d0fb6e_ak_j03d_hc2_01_empty() {
    let e = ev("HC2-01", &["0", "0"]).take_off;
    assert_eq!((e.total_kg(), e.cg_mm_rounded()), (640, 2150));
}
#[test]
fn sr_5ca0ef_ak_y112_hc2_stations() {
    let names: Vec<_> = TYPES[1].stations.iter().map(|s| (s.name, s.max_kg)).collect();
    assert_eq!(names, vec![("Front seats", 220), ("Baggage compartment", 40)]);
}
#[test]
fn sr_a93b59_ak_qq3j_hc2_aft_limit_exceeded() {
    let e = ev("HC2-01", &["60", "40"]).take_off;
    assert_eq!((e.total_kg(), e.cg_mm_rounded()), (740, 2178));
    assert_eq!(e.indications, vec![OUT_CG]);
}

// SR-663a61 Aircraft data from the fleet data file
#[test]
fn sr_663a61_ak_cb0f_changed_fleet_file_changes_total_mass() {
    let csv = FLEET_CSV.replace("HC4-02,hc4,778,", "HC4-02,hc4,781,");
    let a = parse_fleet(&csv)
        .unwrap()
        .into_iter()
        .find(|a| a.id == "HC4-02")
        .unwrap();
    let f = fd();
    let e = evaluate(&a, &f.types["hc4"], f.density_g_per_l, &["0", "0", "0"], "0", "0");
    assert_eq!(e.take_off.total_kg(), 781);
}

// SR-0b76d9 Loading table with moments
#[test]
fn sr_0b76d9_ak_hnpk_landing_fuel_row() {
    let e = evf("HC4-01", &["160", "0", "20"], "100", "60");
    let r = &e.landing_fuel;
    assert_eq!(
        (r.litres, kg_rounded(r.g), r.arm_mm, moment_tenths(r.moment_gmm)),
        (Some(40), 29, 2350, 677)
    );
    assert_eq!(
        (
            e.landing.total_kg(),
            e.landing.cg_mm_rounded(),
            moment_tenths(e.landing.moment_gmm)
        ),
        (974, 2223, 21650)
    );
}
#[test]
fn sr_0b76d9_ak_yf9k_table_rows_with_fuel() {
    let e = evf("HC4-01", &["160", "0", "20"], "100", "60");
    let rows: Vec<(String, i64, i64, i64)> = e
        .rows
        .iter()
        .map(|r| (r.name.clone(), kg_rounded(r.g), r.arm_mm, moment_tenths(r.moment_gmm)))
        .collect();
    assert_eq!(
        rows,
        vec![
            ("Empty mass".into(), 765, 2220, 16983),
            ("Front seats".into(), 160, 2000, 3200),
            ("Rear seats".into(), 0, 3250, 0),
            ("Baggage compartment".into(), 20, 3950, 790),
            (FUEL_ROW.into(), 72, 2350, 1692),
        ]
    );
    assert_eq!(e.rows[4].litres, Some(100));
    let t = &e.take_off;
    assert_eq!(
        (t.total_kg(), t.cg_mm_rounded(), moment_tenths(t.moment_gmm)),
        (1017, 2229, 22665)
    );
}

// SR-79804b Fuel mass and lever arm from the fuel interface data file
#[test]
fn sr_79804b_ak_cy7n_hc4_100_l_fuel() {
    let e = evf("HC4-01", &["0", "0", "0"], "100", "0").take_off;
    assert_eq!((e.total_kg(), e.cg_mm_rounded()), (837, 2231));
}
#[test]
fn sr_e47cbf_ak_k2b3_hc2_50_l_fuel() {
    let e = evf("HC2-01", &["0", "0"], "50", "0").take_off;
    assert_eq!((e.total_kg(), e.cg_mm_rounded()), (676, 2147));
}
#[test]
fn sr_79804b_ak_fpkj_changed_fuel_lever_arm_changes_cg() {
    let f = parse_fuel(&FUEL_JSON.replace("\"fuelLeverArmM\": 2.35", "\"fuelLeverArmM\": 2.400")).unwrap();
    assert_eq!(f.types["hc4"].arm_mm, 2400);
    let e = ev_with(&f, "HC4-01", &["0", "0", "0"], "100", "0").take_off;
    assert_eq!(e.cg_mm_rounded(), 2235);
}

// SR-5689df Message for an invalid fuel entry
#[test]
fn sr_5689df_ak_bd65_fuel_above_capacity_message() {
    assert_eq!(
        evf("HC4-01", &["0", "0", "0"], "171", "0").fuel.message.as_deref(),
        Some("Enter 0 to 170 L")
    );
}
#[test]
fn sr_5689df_ak_z3vm_burn_above_fuel_message() {
    assert_eq!(
        evf("HC4-01", &["0", "0", "0"], "100", "101").burn.message.as_deref(),
        Some("Enter 0 to 100 L")
    );
}
#[test]
fn sr_5689df_ak_cm4v_fuel_fraction_message() {
    assert_eq!(
        evf("HC4-01", &["0", "0", "0"], "12.5", "0").fuel.message.as_deref(),
        Some("Enter 0 to 170 L")
    );
}

// SR-90608c Limit indication at landing
#[test]
fn sr_90608c_ak_zmv0_landing_within_limits() {
    let e = evf("HC4-01", &["160", "0", "20"], "100", "60").landing;
    assert_eq!((e.total_kg(), e.cg_mm_rounded()), (974, 2223));
    assert_eq!(e.indications, vec![WITHIN]);
}
#[test]
fn sr_90608c_ak_nqrm_landing_aft_of_aft_limit() {
    let e = evf("HC4-01", &["60", "190", "50"], "50", "40");
    assert_eq!((e.take_off.total_kg(), e.take_off.cg_mm_rounded()), (1101, 2469));
    assert_eq!(e.take_off.indications, vec![WITHIN]);
    assert_eq!((e.landing.total_kg(), e.landing.cg_mm_rounded()), (1072, 2472));
    assert_eq!(e.landing.indications, vec![OUT_CG]);
}
#[test]
fn sr_bd8e44_ak_dnhh_hc2_landing_aft_of_aft_limit() {
    let e = evf("HC2-01", &["60", "35"], "52", "10");
    assert_eq!(e.take_off.indications, vec![WITHIN]);
    assert_eq!(e.landing.indications, vec![OUT_CG]);
}
