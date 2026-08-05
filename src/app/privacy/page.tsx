import type { Metadata } from "next";
import { AppLayout } from "@/components/layout";

export const metadata: Metadata = {
  title: "개인정보처리방침 · Sudoku",
  description: "Sudoku 웹앱의 개인정보 수집·이용에 관한 안내",
};

const UPDATED_AT = "2026년 7월 23일";
const CONTACT_EMAIL = "leeji.circle@gmail.com";

const PrivacyPage = () => {
  return (
    <AppLayout headerVariant="home">
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-bold">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          시행일: {UPDATED_AT}
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <p>
            Sudoku(이하 “서비스”)는 이용자의 개인정보를 소중히 다루며, 아래와
            같이 최소한의 정보만 수집·이용합니다. 본 서비스는 개인이 운영하는
            비영리 프로젝트입니다.
          </p>

          <section>
            <h2 className="mb-2 text-base font-semibold">
              1. 수집하는 개인정보 항목
            </h2>
            <p className="mb-2 text-muted-foreground">
              게임은 로그인 없이 이용할 수 있으며, 이 경우 아무런 개인정보도
              서버로 전송되지 않습니다.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>소셜 로그인 시(Google·Naver)</strong>: 이름, 이메일
                주소, 프로필 이미지, 닉네임, 그리고 로그인 유지를 위한 인증
                토큰·세션 정보.
              </li>
              <li>
                <strong>게임 기록</strong>: 스테이지 번호, 클리어 시간, 힌트 사용
                횟수, 별점, 클리어 일시.
              </li>
              <li>
                <strong>비로그인(게스트) 이용 시</strong>: 게임 기록은 서버가
                아닌 이용자의 브라우저(localStorage)에만 저장됩니다. 이후
                로그인하면 해당 기록이 서버 계정으로 동기화될 수 있습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">2. 이용 목적</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>회원 식별 및 로그인 상태 유지</li>
              <li>게임 진행 상황 저장 및 스테이지별 랭킹 제공</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">
              3. 보유 및 이용 기간
            </h2>
            <p>
              수집한 개인정보는 회원 탈퇴 시 지체 없이 파기합니다. 브라우저에
              저장된 게스트 기록은 이용자가 브라우저 데이터를 삭제하면 함께
              삭제됩니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">4. 제3자 제공</h2>
            <p>
              서비스는 이용자의 개인정보를 제3자에게 제공하거나 판매하지
              않습니다. 로그인은 Google·Naver의 OAuth 인증을 통해 이루어지며, 각
              제공사의 개인정보처리방침이 별도로 적용됩니다.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">5. 이용자의 권리</h2>
            <p>
              이용자는 언제든지 자신의 개인정보 열람·수정·삭제 및 회원 탈퇴를
              요청할 수 있습니다. 요청은 아래 연락처로 문의해 주세요.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold">6. 문의</h2>
            <p>
              개인정보 관련 문의:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sudoku-primary underline underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <p className="text-muted-foreground">
            본 방침은 {UPDATED_AT}부터 적용됩니다. 내용이 변경될 경우 본
            페이지를 통해 안내합니다.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default PrivacyPage;
