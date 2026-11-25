//! Acceptance tests of release 3: the HC-2 replacement requirements that need a changed data file,
//! the fuel interface version, data files not readable in their documented form, an aircraft
//! without a fuel report and a total mass below the envelope. Names as in `acceptance.rs`.
#![expect(
    clippy::unwrap_used,
    clippy::indexing_slicing,
    reason = "test helpers fail the test loudly on broken data; the lints stay on for the core"
)]

use wb_core::calc::{Evaluation, OUT_BELOW, OUT_CG, OUT_MASS, WITHIN, evaluate};
use wb_core::fleet::{Aircraft, FLEET_CSV, TYPES, parse_fleet};
use wb_core::fleet_json_from;
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

#[test]
fn sr_d0fb6e_ak_jsz9_hc2_01_front_seats_220_kg() {
    let e = ev("HC2-01", &["220", "0"]).take_off;
    assert_eq!((e.total_kg(), e.cg_mm_rounded()), (860, 2112));
}

#[test]
fn sr_d0fb6e_ak_d8yh_hc2_01_baggage_40_kg() {
    let e = ev("HC2-01", &["0", "40"]).take_off;
    assert_eq!((e.total_kg(), e.cg_mm_rounded()), (680, 2194));
}

#[test]
fn sr_e47cbf_ak_fy23_changed_hc2_fuel_lever_arm_changes_cg() {
    let f = parse_fuel(&FUEL_JSON.replace("\"fuelLeverArmM\": 2.1,", "\"fuelLeverArmM\": 2.200,")).unwrap();
    assert_eq!(f.types["hc2"].arm_mm, 2200);
    let e = ev_with(&f, "HC2-01", &["0", "0"], "50", "0").take_off;
    assert_eq!(e.cg_mm_rounded(), 2153);
}

#[test]
fn sr_56d038_ak_qxhd_changed_fleet_file_changes_hc2_total_mass() {
    let csv = FLEET_CSV.replace("HC2-01,hc2,640,", "HC2-01,hc2,645,");
    let a = parse_fleet(&csv)
        .unwrap()
        .into_iter()
        .find(|a| a.id == "HC2-01")
        .unwrap();
    let f = fd();
    let e = evaluate(&a, &f.types["hc2"], f.density_g_per_l, &["0", "0"], "0", "0");
    assert_eq!(e.take_off.total_kg(), 645);
}

// SR-45198e: both indications when mass and centre of gravity are exceeded, the mass first
// (limit check rule), also for an aircraft whose empty mass alone is far aft.
#[test]
fn sr_45198e_ak_yk0x_synthetic_aircraft_mass_first() {
    // Synthetic aircraft with a far aft empty mass: no real loading of the fleet exceeds both so.
    let a = Aircraft {
        id: "T".into(),
        type_index: 0,
        empty_kg: 1100,
        empty_arm_mm: 2600,
        weighing_date: "-".into(),
    };
    let f = fd();
    let e = evaluate(&a, &f.types["hc4"], f.density_g_per_l, &["100", "0", "0"], "0", "0");
    assert_eq!(e.take_off.indications, vec![OUT_MASS, OUT_CG]);
}

/// The fleet JSON of the core, or its error, for the given data files.
fn fleet(csv: &str, fuel: &str, key: &str) -> String {
    fleet_json_from(csv, fuel, key)
}
fn refused(j: &str) -> bool {
    j.starts_with("{\"error\":") && !j.contains("\"aircraft\"")
}

// SR-b53822 Unsupported fuel interface version
#[test]
fn sr_b53822_ak_dzj0_major_version_2_is_refused() {
    let j = fleet(FLEET_CSV, &FUEL_JSON.replace("\"1.0.1\"", "\"2.0.0\""), "hc4");
    assert!(refused(&j), "{j}");
    assert!(j.contains("unsupported interface version 2.0.0"), "{j}");
}
#[test]
fn sr_b53822_ak_fd7z_malformed_version_1_0_is_refused() {
    for v in ["1.0", "1.0.1.2", "1..1", "1.a.0", "01.0.1"] {
        let j = fleet(FLEET_CSV, &FUEL_JSON.replace("\"1.0.1\"", &format!("\"{v}\"")), "hc2");
        assert!(refused(&j), "{v}: {j}");
    }
}
#[test]
fn sr_b53822_ak_bcrp_minor_version_1_1_0_is_read() {
    let j = fleet(FLEET_CSV, &FUEL_JSON.replace("\"1.0.1\"", "\"1.1.0\""), "hc4");
    assert!(
        j.contains("\"id\":\"HC4-01\"") && j.contains("\"id\":\"HC4-02\""),
        "{j}"
    );
}

// SR-ecf597 Data file not readable in its documented form
#[test]
fn sr_ecf597_ak_stzd_fuel_file_with_duplicate_member_is_refused() {
    let dup = FUEL_JSON.replace("\"HC4-02\": {", "\"HC4-01\": {");
    assert!(refused(&fleet(FLEET_CSV, &dup, "hc4")));
    let dup_type = FUEL_JSON.replace("\"HC-2\": { \"fuelLeverArmM\"", "\"hc4\": { \"fuelLeverArmM\"");
    assert!(refused(&fleet(FLEET_CSV, &dup_type, "hc4")));
}
#[test]
fn sr_ecf597_ak_stzd_fuel_file_with_number_out_of_range_is_refused() {
    let big = FUEL_JSON.replace("\"fuelLeverArmM\": 2.35", "\"fuelLeverArmM\": 99999999999999999");
    assert!(refused(&fleet(FLEET_CSV, &big, "hc4")));
    assert!(refused(&fleet(FLEET_CSV, "{}", "hc4")));
    assert!(refused(&fleet(
        FLEET_CSV,
        &FUEL_JSON.replace("\"usableFuelL\": 142", "\"usableFuelL\": \"142\""),
        "hc4"
    )));
}
#[test]
fn sr_ecf597_ak_t42r_fleet_file_with_missing_field_is_refused() {
    let short = FLEET_CSV.replace("HC4-01,hc4,765,2220,2026-03-02", "HC4-01,hc4,765");
    assert!(refused(&fleet(&short, FUEL_JSON, "hc4")));
    assert!(parse_fleet("HC4-01,hc4,765").is_err());
}
#[test]
fn sr_ecf597_ak_t42r_fleet_file_with_unknown_type_is_refused() {
    let unknown = FLEET_CSV.replace("HC4-01,hc4,", "HC4-01,hc9,");
    assert!(refused(&fleet(&unknown, FUEL_JSON, "hc4")));
    assert!(parse_fleet("HC4-01,hc9,765,2220,2026-01-01").is_err());
}

// SR-9d15c9 Aircraft without a fuel report
#[test]
fn sr_9d15c9_ak_w7qh_aircraft_without_report_has_no_fuel_figure() {
    let without = FUEL_JSON.replace(
        "    \"HC4-02\": { \"type\": \"HC-4\", \"usableFuelL\": 96, \"fuelMassKg\": 69.1, \"reportedAtUtc\": \"2026-11-02T05:15:00Z\" },\n",
        "",
    );
    assert_ne!(without, FUEL_JSON);
    let j = fleet(FLEET_CSV, &without, "hc4");
    assert!(j.contains("\"id\":\"HC4-02\",\"emptyKg\":778,\"emptyArmMm\":2236,\"weighingDate\":\"2026-09-14\",\"reportedFuelL\":null,\"reportedAt\":null"), "{j}");
    assert!(j.contains("\"reportedFuelL\":142"), "{j}");
}

// SR-e6d15f Aircraft selection of the HC-2 build: the HC-2 fleet only
#[test]
fn sr_e6d15f_ak_q7ty_hc2_build_offers_hc2_01_only() {
    let f = wb_core::fleet_json("hc2");
    assert!(f.contains("HC2-01") && !f.contains("HC4-01") && !f.contains("HC4-02"));
    assert!(f.contains("\"reportedFuelL\":78") && f.contains("\"fuelCapacityL\":104"));
    assert!(wb_core::evaluate_json("hc2\nHC4-01\n0\n0\n0\n0").contains("unknown aircraft"));
}

// SR-348143 through the JSON interface of the core
#[test]
fn sr_348143_ak_jk10_total_mass_through_the_json_interface() {
    let j = wb_core::evaluate_json("hc4\nHC4-01\n160\n0\n20\n100\n60");
    assert!(j.contains("\"totalKg\":1017"), "{j}");
    assert!(j.contains("\"cgMm\":2229"));
    assert!(j.contains("\"totalKg\":974"));
    assert!(j.contains("\"Within limits\""));
}

// SR-bb9061 Total mass below the lowest mass of the envelope (both aircraft types)
/// A synthetic aircraft of the type with index `ti`, with the given empty mass and lever arm.
fn synthetic(ti: usize, kg: i64, arm_mm: i64) -> Aircraft {
    Aircraft {
        id: "T".into(),
        type_index: ti,
        empty_kg: kg,
        empty_arm_mm: arm_mm,
        weighing_date: "-".into(),
    }
}
#[test]
fn sr_bb9061_ak_b8d6_total_mass_below_the_envelope_is_outside() {
    let f = fd();
    for (ti, key, lowest, arm, empty) in [
        (0, "hc4", 650, 2200, ["0", "0", "0"].as_slice()),
        (1, "hc2", 550, 2100, ["0", "0"].as_slice()),
    ] {
        let e = evaluate(
            &synthetic(ti, lowest - 10, arm),
            &f.types[key],
            f.density_g_per_l,
            empty,
            "0",
            "0",
        )
        .take_off;
        assert_eq!(e.indications, vec![OUT_BELOW], "{key}");
        assert!(!e.indications.contains(&WITHIN));
    }
}
#[test]
fn sr_bb9061_ak_cn28_total_mass_at_the_lowest_mass_is_within() {
    let f = fd();
    for (ti, key, lowest, arm, empty) in [
        (0, "hc4", 650, 2200, ["0", "0", "0"].as_slice()),
        (1, "hc2", 550, 2100, ["0", "0"].as_slice()),
    ] {
        let e = evaluate(
            &synthetic(ti, lowest, arm),
            &f.types[key],
            f.density_g_per_l,
            empty,
            "0",
            "0",
        )
        .take_off;
        assert_eq!(e.indications, vec![WITHIN], "{key}");
    }
}
