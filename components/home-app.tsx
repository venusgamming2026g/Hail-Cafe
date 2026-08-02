"use client";

import {
  CalendarDays,
  Clock3,
  Facebook,
  Instagram,
  MapPin,
  Phone,
  ShoppingBag,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  officialBranch,
  officialMapUrl,
  officialSocial,
} from "../lib/restaurant";

const featuredItems = [
  {
    name: "كومبو بلاتر",
    price: "9.95",
    image: "/hail-gallery/combo-platter.jpeg",
  },
  {
    name: "ناتشوز هيل",
    price: "5.25",
    image: "/hail-gallery/nachos.jpeg",
  },
  {
    name: "تشيزكيك بالشوكولاتة",
    price: "4.50",
    image: "/hail-gallery/cheesecake.jpeg",
  },
  {
    name: "موهيتو بلو أوشن",
    price: "3.75",
    image: "/hail-gallery/mocktails.jpeg",
  },
] as const;

export function HomeApp() {
  const [reserveDate, setReserveDate] = useState("");
  const [reserveTime, setReserveTime] = useState("19:00");
  const [reserveGuests, setReserveGuests] = useState("2");
  const reserveDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (reserveDateRef.current) {
      reserveDateRef.current.min = new Date().toISOString().slice(0, 10);
    }
  }, []);

  function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reserveDate) {
      reserveDateRef.current?.focus();
      return;
    }

    const message = [
      "مرحباً، أريد حجز طاولة في هيل كافيه.",
      `التاريخ: ${reserveDate}`,
      `الساعة: ${reserveTime}`,
      `عدد الأشخاص: ${reserveGuests}`,
    ].join("\n");
    const waNumber = officialBranch.phone.replace(/[^0-9]/g, "");
    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div className="home-shell">
      <a className="skip-link" href="#home-main">
        انتقل إلى المحتوى
      </a>

      <header className="home-header">
        <Link className="home-brand" href="/" aria-label="هيل كافيه — الرئيسية">
          <img
            src="/hail-logo.png"
            width="72"
            height="72"
            alt="هيل كافيه"
          />
        </Link>
        <nav className="home-nav" aria-label="التنقل الرئيسي">
          <Link href="/menu">قائمتنا</Link>
          <a href="#reserve">احجز</a>
          <a href="#about">قصتنا</a>
          <a href="#visit">الموقع</a>
          <a href={`tel:${officialBranch.phone}`}>تواصل معنا</a>
        </nav>
        <Link className="home-header-cta" href="/menu">
          <ShoppingBag size={18} aria-hidden="true" />
          المنيو
        </Link>
      </header>

      <main id="home-main">
        <section className="home-hero" aria-labelledby="home-hero-title">
          <img
            className="home-hero-image"
            src="/hail-gallery/home-hero.jpeg"
            width="1170"
            height="1403"
            alt="جلسة صباحية وطاولة فطور في هيل كافيه"
            fetchPriority="high"
          />
          <div className="home-hero-shade" aria-hidden="true" />
          <div className="home-hero-content">
            <p className="home-kicker">هيل كافيه · إربد سيتي سنتر</p>
            <h1 id="home-hero-title">
              كل لحظة إلها طعم،
              <br />
              <span>والضحكة غير.</span>
            </h1>
            <p>
              فطور، قهوة، أطباق للمشاركة وأجواء بتجمع الناس الحلوة.
            </p>
            <div className="home-hero-actions">
              <a className="home-primary-action" href="#reserve">
                <CalendarDays size={19} aria-hidden="true" />
                احجز طاولتك الآن
              </a>
              <Link className="home-secondary-action" href="/menu">
                <ShoppingBag size={19} aria-hidden="true" />
                تصفّح المنيو
              </Link>
            </div>
          </div>
        </section>

        <section className="home-featured" aria-labelledby="featured-title">
          <div className="home-section-heading">
            <div>
              <p>من منيو هيل</p>
              <h2 id="featured-title">أطباق بتحكي عن حالها</h2>
            </div>
            <Link href="/menu">شاهد المنيو كاملًا</Link>
          </div>
          <div className="home-featured-grid">
            {featuredItems.map((item) => (
              <Link className="home-dish-card" href="/menu" key={item.name}>
                <span className="home-dish-media">
                  <img
                    src={item.image}
                    width="420"
                    height="420"
                    loading="lazy"
                    alt={item.name}
                  />
                </span>
                <span className="home-dish-copy">
                  <strong>{item.name}</strong>
                  <small>{item.price} د.أ</small>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="home-about" id="about" aria-labelledby="about-title">
          <div className="home-about-media">
            <img
              src="/hail-gallery/combo-platter.jpeg"
              width="1170"
              height="1399"
              loading="lazy"
              alt="كومبو بلاتر هيل كافيه"
            />
          </div>
          <div className="home-about-copy">
            <p>أجواؤنا</p>
            <h2 id="about-title">مستوحى من تراثنا، ومصمّم لراحتكم.</h2>
            <p>
              في هيل، الأكل الحلو بداية الحكاية. المكان دافئ، التفاصيل قريبة،
              وكل طاولة معمولة لتجمع الصحبة وتخلّي اللحظة أطول.
            </p>
            <div className="home-about-facts" role="list" aria-label="مميزات هيل كافيه">
              <span role="listitem">منيو متنوّع</span>
              <span role="listitem">جلسات داخلية</span>
              <span role="listitem">طلبات طاولة</span>
            </div>
            <Link href="/menu">اكتشف أطباقنا</Link>
          </div>
        </section>

        <section className="home-reserve" id="reserve" aria-labelledby="reserve-title">
          <form className="home-reserve-card" onSubmit={submitReservation}>
            <div className="home-reserve-heading">
              <p>موعدنا الجاي</p>
              <h2 id="reserve-title">احجز طاولتك</h2>
              <span>اختر التفاصيل وسنفتح لك واتساب لتأكيد الحجز مع الفرع.</span>
            </div>
            <div className="home-reserve-fields">
              <label>
                <span>
                  <CalendarDays size={16} aria-hidden="true" /> التاريخ
                </span>
                <input
                  ref={reserveDateRef}
                  type="date"
                  required
                  value={reserveDate}
                  onChange={(event) => setReserveDate(event.target.value)}
                />
              </label>
              <label>
                <span>
                  <Clock3 size={16} aria-hidden="true" /> الساعة
                </span>
                <input
                  type="time"
                  required
                  value={reserveTime}
                  onChange={(event) => setReserveTime(event.target.value)}
                />
              </label>
              <label>
                <span>
                  <Users size={16} aria-hidden="true" /> عدد الأشخاص
                </span>
                <select
                  value={reserveGuests}
                  onChange={(event) => setReserveGuests(event.target.value)}
                >
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(
                    (count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <button type="submit">احجز الآن</button>
          </form>
        </section>

        <section className="home-visit" id="visit" aria-labelledby="visit-title">
          <div>
            <p>زورونا</p>
            <h2 id="visit-title">إربد سيتي سنتر</h2>
            <span>{officialBranch.addressAr}</span>
          </div>
          <div className="home-visit-actions">
            <a href={officialMapUrl} target="_blank" rel="noreferrer">
              <MapPin size={19} aria-hidden="true" /> افتح الخريطة
            </a>
            <a href={`tel:${officialBranch.phone}`}>
              <Phone size={19} aria-hidden="true" />
              {officialBranch.phoneDisplay}
            </a>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-footer-branch">
          <img src="/hail-logo.png" width="96" height="96" alt="" />
          <div>
            <strong>هيل كافيه</strong>
            <span>إربد سيتي سنتر</span>
          </div>
        </div>
        <div className="home-footer-hours">
          <strong>ساعات العمل</strong>
          <span>يوميًا 10 ص — 12 ص</span>
          <span>الجمعة 2 م — 12 ص</span>
        </div>
        <div className="home-footer-links">
          <a href={officialSocial.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
            <Instagram size={21} aria-hidden="true" />
          </a>
          <a href={officialSocial.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
            <Facebook size={21} aria-hidden="true" />
          </a>
          <Link href="/ops">دخول الطاقم</Link>
        </div>
      </footer>
    </div>
  );
}
